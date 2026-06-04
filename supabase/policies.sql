-- 1. PROFILES policies
CREATE POLICY "Allow public read of profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. MOTHERS policies
CREATE POLICY "Allow read of own mother profile or connected doctor"
  ON public.mothers FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = mothers.id AND dpl.status = 'active'
    )
  );

CREATE POLICY "Allow insert of own mother profile"
  ON public.mothers FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update of own mother profile"
  ON public.mothers FOR UPDATE
  USING (auth.uid() = id);

-- 3. DOCTORS policies
CREATE POLICY "Allow public read of doctors"
  ON public.doctors FOR SELECT
  USING (true);

CREATE POLICY "Allow insert of own doctor profile"
  ON public.doctors FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update of own doctor profile"
  ON public.doctors FOR UPDATE
  USING (auth.uid() = id);

-- 4. PREGNANCIES policies
CREATE POLICY "Allow read of pregnancy for mother or linked doctor"
  ON public.pregnancies FOR SELECT
  USING (
    mother_id = auth.uid() OR 
    obstetrician_id = auth.uid()
  );

CREATE POLICY "Allow mother to create pregnancy"
  ON public.pregnancies FOR INSERT
  WITH CHECK (mother_id = auth.uid());

CREATE POLICY "Allow mother or doctor to update pregnancy"
  ON public.pregnancies FOR UPDATE
  USING (mother_id = auth.uid() OR obstetrician_id = auth.uid());

-- 5. BABIES policies
CREATE POLICY "Allow read of baby profile for mother or linked doctor"
  ON public.babies FOR SELECT
  USING (
    mother_id = auth.uid() OR 
    pediatrician_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = babies.mother_id AND dpl.status = 'active'
    )
  );

CREATE POLICY "Allow mother to create baby profile"
  ON public.babies FOR INSERT
  WITH CHECK (mother_id = auth.uid());

CREATE POLICY "Allow mother or pediatrician to update baby profile"
  ON public.babies FOR UPDATE
  USING (mother_id = auth.uid() OR pediatrician_id = auth.uid());

-- 6. DOCTOR_PATIENT_LINKS policies
CREATE POLICY "Allow users to view links related to them"
  ON public.doctor_patient_links FOR SELECT
  USING (mother_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Allow users to insert links related to them"
  ON public.doctor_patient_links FOR INSERT
  WITH CHECK (mother_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Allow users to update links related to them"
  ON public.doctor_patient_links FOR UPDATE
  USING (mother_id = auth.uid() OR doctor_id = auth.uid());

-- 7. APPOINTMENTS policies
CREATE POLICY "Allow users to read appointments related to them"
  ON public.appointments FOR SELECT
  USING (mother_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Allow users to insert appointments related to them"
  ON public.appointments FOR INSERT
  WITH CHECK (mother_id = auth.uid() OR doctor_id = auth.uid());

CREATE POLICY "Allow users to update appointments related to them"
  ON public.appointments FOR UPDATE
  USING (mother_id = auth.uid() OR doctor_id = auth.uid());

-- 8. PRENATAL_VISITS policies
CREATE POLICY "Allow read of prenatal visits for mother or doctor"
  ON public.prenatal_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pregnancies p
      WHERE p.id = prenatal_visits.pregnancy_id AND (p.mother_id = auth.uid() OR p.obstetrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow doctor to insert prenatal visits"
  ON public.prenatal_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pregnancies p
      WHERE p.id = prenatal_visits.pregnancy_id AND p.obstetrician_id = auth.uid()
    )
  );

CREATE POLICY "Allow doctor to update prenatal visits"
  ON public.prenatal_visits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pregnancies p
      WHERE p.id = prenatal_visits.pregnancy_id AND p.obstetrician_id = auth.uid()
    )
  );

-- 9. PEDIATRIC_VISITS policies
CREATE POLICY "Allow read of pediatric visits for mother or doctor"
  ON public.pediatric_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = pediatric_visits.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow doctor to insert pediatric visits"
  ON public.pediatric_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = pediatric_visits.baby_id AND b.pediatrician_id = auth.uid()
    )
  );

CREATE POLICY "Allow doctor to update pediatric visits"
  ON public.pediatric_visits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = pediatric_visits.baby_id AND b.pediatrician_id = auth.uid()
    )
  );

-- 10. LAB_RESULTS policies
CREATE POLICY "Allow read of lab results for mother or doctor"
  ON public.lab_results FOR SELECT
  USING (
    mother_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.pregnancies p
      WHERE p.id = lab_results.pregnancy_id AND (p.mother_id = auth.uid() OR p.obstetrician_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = lab_results.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow upload of lab results"
  ON public.lab_results FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- 11. ULTRASOUND_RESULTS policies
CREATE POLICY "Allow read of ultrasound results for mother or doctor"
  ON public.ultrasound_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pregnancies p
      WHERE p.id = ultrasound_results.pregnancy_id AND (p.mother_id = auth.uid() OR p.obstetrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow upload of ultrasound results"
  ON public.ultrasound_results FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- 12. SYMPTOMS policies
CREATE POLICY "Allow mother or doctor to read symptoms"
  ON public.symptoms FOR SELECT
  USING (
    mother_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = symptoms.mother_id AND dpl.status = 'active'
    )
  );

CREATE POLICY "Allow mother to insert symptoms"
  ON public.symptoms FOR INSERT
  WITH CHECK (mother_id = auth.uid());

-- 13. VITAL_SIGNS policies
CREATE POLICY "Allow mother or doctor to read vital signs"
  ON public.vital_signs FOR SELECT
  USING (
    mother_id = auth.uid() OR
    (baby_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = vital_signs.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )) OR
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = vital_signs.mother_id AND dpl.status = 'active'
    )
  );

CREATE POLICY "Allow insert of vital signs"
  ON public.vital_signs FOR INSERT
  WITH CHECK (
    mother_id = auth.uid() OR
    (baby_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = vital_signs.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )) OR
    EXISTS (
      SELECT 1 FROM public.doctor_patient_links dpl
      WHERE dpl.doctor_id = auth.uid() AND dpl.mother_id = vital_signs.mother_id AND dpl.status = 'active'
    )
  );

-- 14. BABY_VACCINES policies
CREATE POLICY "Allow read of baby vaccines"
  ON public.baby_vaccines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = baby_vaccines.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow update/insert of baby vaccines"
  ON public.baby_vaccines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = baby_vaccines.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

-- 15. GROWTH_RECORDS policies
CREATE POLICY "Allow read of growth records"
  ON public.growth_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = growth_records.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow insert/update of growth records"
  ON public.growth_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = growth_records.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

-- 16. DEVELOPMENT_MILESTONES policies
CREATE POLICY "Allow read of milestones"
  ON public.development_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = development_milestones.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

CREATE POLICY "Allow insert/update of milestones"
  ON public.development_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.babies b
      WHERE b.id = development_milestones.baby_id AND (b.mother_id = auth.uid() OR b.pediatrician_id = auth.uid())
    )
  );

-- 17. MESSAGES policies
CREATE POLICY "Allow read of own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Allow send of own messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- 18. NOTIFICATIONS policies
CREATE POLICY "Allow read of own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow update of own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
