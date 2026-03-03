
-- 1. Add discount columns to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount_active boolean NOT NULL DEFAULT false;

-- 2. Create admin_employees table
CREATE TABLE public.admin_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  employee_user_id uuid,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'staff',
  permissions text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all admin employees"
  ON public.admin_employees FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin employees can view own record"
  ON public.admin_employees FOR SELECT
  USING (employee_user_id = auth.uid());

CREATE TRIGGER update_admin_employees_updated_at
  BEFORE UPDATE ON public.admin_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
