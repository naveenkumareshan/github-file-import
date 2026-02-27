
-- Migration 3: Seed Indian states/UTs and major cities

-- Insert 28 States + 8 UTs
INSERT INTO public.states (name, code) VALUES
('Andhra Pradesh', 'AP'),
('Arunachal Pradesh', 'AR'),
('Assam', 'AS'),
('Bihar', 'BR'),
('Chhattisgarh', 'CG'),
('Goa', 'GA'),
('Gujarat', 'GJ'),
('Haryana', 'HR'),
('Himachal Pradesh', 'HP'),
('Jharkhand', 'JH'),
('Karnataka', 'KA'),
('Kerala', 'KL'),
('Madhya Pradesh', 'MP'),
('Maharashtra', 'MH'),
('Manipur', 'MN'),
('Meghalaya', 'ML'),
('Mizoram', 'MZ'),
('Nagaland', 'NL'),
('Odisha', 'OD'),
('Punjab', 'PB'),
('Rajasthan', 'RJ'),
('Sikkim', 'SK'),
('Tamil Nadu', 'TN'),
('Telangana', 'TS'),
('Tripura', 'TR'),
('Uttar Pradesh', 'UP'),
('Uttarakhand', 'UK'),
('West Bengal', 'WB'),
('Andaman and Nicobar Islands', 'AN'),
('Chandigarh', 'CH'),
('Dadra and Nagar Haveli and Daman and Diu', 'DD'),
('Delhi', 'DL'),
('Jammu and Kashmir', 'JK'),
('Ladakh', 'LA'),
('Lakshadweep', 'LD'),
('Puducherry', 'PY')
ON CONFLICT (name) DO NOTHING;

-- Insert major cities per state
INSERT INTO public.cities (name, state_id) VALUES
-- Andhra Pradesh
('Visakhapatnam', (SELECT id FROM public.states WHERE code='AP')),
('Vijayawada', (SELECT id FROM public.states WHERE code='AP')),
('Guntur', (SELECT id FROM public.states WHERE code='AP')),
('Tirupati', (SELECT id FROM public.states WHERE code='AP')),
('Kurnool', (SELECT id FROM public.states WHERE code='AP')),
-- Bihar
('Patna', (SELECT id FROM public.states WHERE code='BR')),
('Gaya', (SELECT id FROM public.states WHERE code='BR')),
('Muzaffarpur', (SELECT id FROM public.states WHERE code='BR')),
('Bhagalpur', (SELECT id FROM public.states WHERE code='BR')),
-- Chhattisgarh
('Raipur', (SELECT id FROM public.states WHERE code='CG')),
('Bhilai', (SELECT id FROM public.states WHERE code='CG')),
('Bilaspur', (SELECT id FROM public.states WHERE code='CG')),
-- Delhi
('New Delhi', (SELECT id FROM public.states WHERE code='DL')),
-- Goa
('Panaji', (SELECT id FROM public.states WHERE code='GA')),
('Margao', (SELECT id FROM public.states WHERE code='GA')),
-- Gujarat
('Ahmedabad', (SELECT id FROM public.states WHERE code='GJ')),
('Surat', (SELECT id FROM public.states WHERE code='GJ')),
('Vadodara', (SELECT id FROM public.states WHERE code='GJ')),
('Rajkot', (SELECT id FROM public.states WHERE code='GJ')),
('Gandhinagar', (SELECT id FROM public.states WHERE code='GJ')),
-- Haryana
('Gurugram', (SELECT id FROM public.states WHERE code='HR')),
('Faridabad', (SELECT id FROM public.states WHERE code='HR')),
('Panipat', (SELECT id FROM public.states WHERE code='HR')),
('Ambala', (SELECT id FROM public.states WHERE code='HR')),
-- Himachal Pradesh
('Shimla', (SELECT id FROM public.states WHERE code='HP')),
('Dharamshala', (SELECT id FROM public.states WHERE code='HP')),
-- Jharkhand
('Ranchi', (SELECT id FROM public.states WHERE code='JH')),
('Jamshedpur', (SELECT id FROM public.states WHERE code='JH')),
('Dhanbad', (SELECT id FROM public.states WHERE code='JH')),
-- Karnataka
('Bengaluru', (SELECT id FROM public.states WHERE code='KA')),
('Mysuru', (SELECT id FROM public.states WHERE code='KA')),
('Hubli', (SELECT id FROM public.states WHERE code='KA')),
('Mangalore', (SELECT id FROM public.states WHERE code='KA')),
-- Kerala
('Thiruvananthapuram', (SELECT id FROM public.states WHERE code='KL')),
('Kochi', (SELECT id FROM public.states WHERE code='KL')),
('Kozhikode', (SELECT id FROM public.states WHERE code='KL')),
('Thrissur', (SELECT id FROM public.states WHERE code='KL')),
-- Madhya Pradesh
('Bhopal', (SELECT id FROM public.states WHERE code='MP')),
('Indore', (SELECT id FROM public.states WHERE code='MP')),
('Jabalpur', (SELECT id FROM public.states WHERE code='MP')),
('Gwalior', (SELECT id FROM public.states WHERE code='MP')),
-- Maharashtra
('Mumbai', (SELECT id FROM public.states WHERE code='MH')),
('Pune', (SELECT id FROM public.states WHERE code='MH')),
('Nagpur', (SELECT id FROM public.states WHERE code='MH')),
('Nashik', (SELECT id FROM public.states WHERE code='MH')),
('Thane', (SELECT id FROM public.states WHERE code='MH')),
('Aurangabad', (SELECT id FROM public.states WHERE code='MH')),
-- Odisha
('Bhubaneswar', (SELECT id FROM public.states WHERE code='OD')),
('Cuttack', (SELECT id FROM public.states WHERE code='OD')),
-- Punjab
('Ludhiana', (SELECT id FROM public.states WHERE code='PB')),
('Amritsar', (SELECT id FROM public.states WHERE code='PB')),
('Jalandhar', (SELECT id FROM public.states WHERE code='PB')),
-- Rajasthan
('Jaipur', (SELECT id FROM public.states WHERE code='RJ')),
('Jodhpur', (SELECT id FROM public.states WHERE code='RJ')),
('Udaipur', (SELECT id FROM public.states WHERE code='RJ')),
('Kota', (SELECT id FROM public.states WHERE code='RJ')),
('Ajmer', (SELECT id FROM public.states WHERE code='RJ')),
-- Tamil Nadu
('Chennai', (SELECT id FROM public.states WHERE code='TN')),
('Coimbatore', (SELECT id FROM public.states WHERE code='TN')),
('Madurai', (SELECT id FROM public.states WHERE code='TN')),
('Salem', (SELECT id FROM public.states WHERE code='TN')),
('Tiruchirappalli', (SELECT id FROM public.states WHERE code='TN')),
-- Telangana
('Hyderabad', (SELECT id FROM public.states WHERE code='TS')),
('Warangal', (SELECT id FROM public.states WHERE code='TS')),
('Nizamabad', (SELECT id FROM public.states WHERE code='TS')),
('Karimnagar', (SELECT id FROM public.states WHERE code='TS')),
-- Uttar Pradesh
('Lucknow', (SELECT id FROM public.states WHERE code='UP')),
('Kanpur', (SELECT id FROM public.states WHERE code='UP')),
('Agra', (SELECT id FROM public.states WHERE code='UP')),
('Varanasi', (SELECT id FROM public.states WHERE code='UP')),
('Noida', (SELECT id FROM public.states WHERE code='UP')),
('Prayagraj', (SELECT id FROM public.states WHERE code='UP')),
('Meerut', (SELECT id FROM public.states WHERE code='UP')),
-- Uttarakhand
('Dehradun', (SELECT id FROM public.states WHERE code='UK')),
('Haridwar', (SELECT id FROM public.states WHERE code='UK')),
-- West Bengal
('Kolkata', (SELECT id FROM public.states WHERE code='WB')),
('Howrah', (SELECT id FROM public.states WHERE code='WB')),
('Siliguri', (SELECT id FROM public.states WHERE code='WB')),
('Durgapur', (SELECT id FROM public.states WHERE code='WB')),
-- Chandigarh
('Chandigarh City', (SELECT id FROM public.states WHERE code='CH')),
-- Jammu and Kashmir
('Srinagar', (SELECT id FROM public.states WHERE code='JK')),
('Jammu', (SELECT id FROM public.states WHERE code='JK')),
-- Puducherry
('Puducherry City', (SELECT id FROM public.states WHERE code='PY')),
-- Assam
('Guwahati', (SELECT id FROM public.states WHERE code='AS')),
('Silchar', (SELECT id FROM public.states WHERE code='AS'))
ON CONFLICT (name, state_id) DO NOTHING;
