
-- Allow students to insert their own receipts (for online due payments)
CREATE POLICY "Students can insert own receipts"
ON public.receipts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow students to update their own dues (for marking paid after payment)
CREATE POLICY "Students can update own dues"
ON public.dues
FOR UPDATE
USING (auth.uid() = user_id);
