-- Add an auditable admin product review path and prevent sellers from self-approving pending listings.
CREATE OR REPLACE FUNCTION private.guard_product_writes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_shop_status text;
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_featured OR NEW.status NOT IN ('pending', 'active') THEN
      RAISE EXCEPTION 'product_field_forbidden' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
      RAISE EXCEPTION 'product_field_forbidden' USING ERRCODE = '42501';
    END IF;

    IF OLD.status = 'rejected' AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'product_rejected_locked' USING ERRCODE = '42501';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
       AND (
         OLD.status NOT IN ('active', 'archived')
         OR NEW.status NOT IN ('active', 'archived')
       ) THEN
      RAISE EXCEPTION 'product_status_forbidden' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    SELECT s.status::text INTO v_shop_status
    FROM public.shops s
    WHERE s.id = NEW.shop_id;

    IF v_shop_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'shop_not_active' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.admin_moderate_product(
  p_product_id uuid,
  p_status public.product_status,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_product public.products%rowtype;
  v_shop_status text;
  v_previous_status text;
  v_action text;
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(public.current_user_has_permission('products.manage'), false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('active'::public.product_status, 'rejected'::public.product_status) THEN
    RAISE EXCEPTION 'invalid_product_moderation_status';
  END IF;

  IF p_note IS NOT NULL AND length(trim(p_note)) > 500 THEN
    RAISE EXCEPTION 'note_too_long';
  END IF;

  SELECT p, s.status::text
  INTO v_product, v_shop_status
  FROM public.products p
  JOIN public.shops s ON s.id = p.shop_id
  WHERE p.id = p_product_id
  FOR UPDATE OF p, s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;

  IF v_product.status <> 'pending'::public.product_status THEN
    RAISE EXCEPTION 'product_not_pending';
  END IF;

  IF p_status = 'active'::public.product_status
     AND v_shop_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'shop_not_active';
  END IF;

  v_previous_status := v_product.status::text;
  v_action := CASE WHEN p_status = 'active' THEN 'approve_product' ELSE 'reject_product' END;

  UPDATE public.products
  SET status = p_status, updated_at = now()
  WHERE id = p_product_id;

  INSERT INTO public.admin_actions(admin_id, action, target_type, target_id, reason, metadata)
  VALUES (
    auth.uid(),
    v_action,
    'product',
    p_product_id,
    nullif(trim(p_note), ''),
    jsonb_build_object('previous_status', v_previous_status, 'new_status', p_status::text)
  );

  INSERT INTO public.audit_logs(actor_id, action, entity_type, entity_id, description, metadata)
  VALUES (
    auth.uid(),
    CASE WHEN p_status = 'active' THEN 'approve'::public.audit_action ELSE 'reject'::public.audit_action END,
    'product',
    p_product_id,
    CASE WHEN p_status = 'active' THEN 'Product approved by admin' ELSE 'Product rejected by admin' END,
    jsonb_build_object('previous_status', v_previous_status, 'new_status', p_status::text)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_moderate_product(
  p_product_id uuid,
  p_status public.product_status,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(public.current_user_has_permission('products.manage'), false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  PERFORM private.admin_moderate_product(p_product_id, p_status, p_note);
END;
$function$;

REVOKE ALL ON FUNCTION private.admin_moderate_product(uuid, public.product_status, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_moderate_product(uuid, public.product_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_product(uuid, public.product_status, text) TO authenticated;
