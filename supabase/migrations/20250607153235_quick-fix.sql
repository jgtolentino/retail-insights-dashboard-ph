-- Disable RLS and populate fresh data
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Clear existing data
DELETE FROM brands;
DELETE FROM stores;

-- Insert comprehensive TBWA client brands and competitors
INSERT INTO brands (id, name, category, is_tbwa) VALUES
-- TBWA CLIENT: Alaska Milk Corporation (Dairy)
(1, 'Alaska Evaporated Milk', 'dairy', true),
(2, 'Alaska Condensed Milk', 'dairy', true),
(3, 'Alaska Powdered Milk', 'dairy', true),
(4, 'Krem-Top Coffee Creamer', 'dairy', true),
(5, 'Alpine Evaporated Milk', 'dairy', true),
(6, 'Alpine Condensed Milk', 'dairy', true),
(7, 'Cow Bell Powdered Milk', 'dairy', true),

-- TBWA CLIENT: Oishi/Liwayway (Snacks)
(8, 'Oishi Prawn Crackers', 'snacks', true),
(9, 'Oishi Pillows', 'snacks', true),
(10, 'Oishi Martys', 'snacks', true),
(11, 'Oishi Ridges', 'snacks', true),
(12, 'Oishi Bread Pan', 'snacks', true),
(13, 'Gourmet Picks', 'snacks', true),
(14, 'Crispy Patata', 'snacks', true),
(15, 'Oaties', 'snacks', true),
(16, 'Hi-Ho Crackers', 'snacks', true),
(17, 'Rinbee', 'snacks', true),
(18, 'Deli Mex', 'snacks', true),

-- TBWA CLIENT: Peerless (Household/Personal Care)
(19, 'Champion Detergent', 'household', true),
(20, 'Champion Fabric Conditioner', 'household', true),
(21, 'Calla Personal Care', 'personal_care', true),
(22, 'Hana Shampoo', 'personal_care', true),
(23, 'Hana Conditioner', 'personal_care', true),
(24, 'Cyclone Bleach', 'household', true),
(25, 'Pride Dishwashing Liquid', 'household', true),
(26, 'Care Plus Alcohol', 'personal_care', true),
(27, 'Care Plus Hand Sanitizer', 'personal_care', true),

-- TBWA CLIENT: Del Monte Philippines (Food/Beverages)
(28, 'Del Monte Pineapple Juice', 'beverages', true),
(29, 'Del Monte Pineapple Chunks', 'food', true),
(30, 'Del Monte Tomato Sauce', 'food', true),
(31, 'Del Monte Tomato Ketchup', 'food', true),
(32, 'Del Monte Spaghetti Sauce', 'food', true),
(33, 'Del Monte Fruit Cocktail', 'food', true),
(34, 'Del Monte Pasta', 'food', true),
(35, 'S&W Premium Fruits', 'food', true),
(36, 'Todays Budget Line', 'food', true),
(37, 'Fit n Right Juice', 'beverages', true),

-- TBWA CLIENT: JTI (Tobacco)
(38, 'Winston Cigarettes', 'tobacco', true),
(39, 'Camel Cigarettes', 'tobacco', true),
(40, 'Mevius Cigarettes', 'tobacco', true),
(41, 'LD Cigarettes', 'tobacco', true),
(42, 'Mighty Cigarettes', 'tobacco', true),
(43, 'Caster Cigarettes', 'tobacco', true),
(44, 'Glamour Cigarettes', 'tobacco', true),

-- TBWA CLIENT: Liwayway Beverages
(45, 'Smart C+ Vitamin Drinks', 'beverages', true),

-- COMPETITORS: Dairy
(46, 'Bear Brand Milk', 'dairy', false),
(47, 'Magnolia Fresh Milk', 'dairy', false),
(48, 'Nestle Carnation', 'dairy', false),
(49, 'Anchor Milk', 'dairy', false),
(50, 'Everyday Milk', 'dairy', false),

-- COMPETITORS: Snacks
(51, 'Jack n Jill Nova', 'snacks', false),
(52, 'Jack n Jill Piattos', 'snacks', false),
(53, 'Jack n Jill Chippy', 'snacks', false),
(54, 'Rebisco Crackers', 'snacks', false),
(55, 'Richeese Crackers', 'snacks', false),
(56, 'Skyflakes Crackers', 'snacks', false),
(57, 'Monde Crackers', 'snacks', false),
(58, 'Hansel Crackers', 'snacks', false),
(59, 'Lays Potato Chips', 'snacks', false),
(60, 'Doritos', 'snacks', false),

-- COMPETITORS: Household
(61, 'Tide Detergent', 'household', false),
(62, 'Ariel Detergent', 'household', false),
(63, 'Surf Detergent', 'household', false),
(64, 'Downy Fabric Conditioner', 'household', false),
(65, 'Joy Dishwashing Liquid', 'household', false),
(66, 'Zonrox Bleach', 'household', false),

-- COMPETITORS: Personal Care
(67, 'Head & Shoulders', 'personal_care', false),
(68, 'Pantene Shampoo', 'personal_care', false),
(69, 'Cream Silk', 'personal_care', false),
(70, 'Sunsilk Shampoo', 'personal_care', false),
(71, 'Clear Shampoo', 'personal_care', false),
(72, 'Safeguard Soap', 'personal_care', false),
(73, 'Dove Soap', 'personal_care', false),
(74, 'Lux Soap', 'personal_care', false),
(75, 'Palmolive Soap', 'personal_care', false),

-- COMPETITORS: Food
(76, 'Hunt''s Tomato Sauce', 'food', false),
(77, 'UFC Ketchup', 'food', false),
(78, 'Clara Ole Pasta Sauce', 'food', false),
(79, 'Lucky Me Instant Noodles', 'food', false),
(80, 'Nissin Cup Noodles', 'food', false),
(81, 'Maggi Noodles', 'food', false),
(82, 'Century Tuna', 'food', false),
(83, 'Argentina Corned Beef', 'food', false),
(84, 'Spam', 'food', false),
(85, 'Libby''s Corned Beef', 'food', false),

-- COMPETITORS: Beverages
(86, 'Coca-Cola', 'beverages', false),
(87, 'Pepsi', 'beverages', false),
(88, 'Sprite', 'beverages', false),
(89, 'Royal Cola', 'beverages', false),
(90, 'Tropicana Juice', 'beverages', false),
(91, 'Minute Maid', 'beverages', false),
(92, 'Zesto Juice', 'beverages', false),
(93, 'Tang Powdered Juice', 'beverages', false),
(94, 'Milo Chocolate Drink', 'beverages', false),
(95, 'Nescafe Coffee', 'beverages', false),
(96, 'Kopiko Coffee', 'beverages', false),
(97, 'Great Taste Coffee', 'beverages', false),
(98, 'Ovaltine', 'beverages', false),
(99, 'Gatorade', 'beverages', false),
(100, 'Powerade', 'beverages', false),

-- COMPETITORS: Tobacco
(101, 'Marlboro', 'tobacco', false),
(102, 'Philip Morris', 'tobacco', false),
(103, 'Lucky Strike', 'tobacco', false),
(104, 'Hope Cigarettes', 'tobacco', false),
(105, 'Fortune Cigarettes', 'tobacco', false);

-- Insert fresh stores
INSERT INTO stores (id, name, location, region, city, latitude, longitude) VALUES
(1, 'SM Mall Manila', 'Manila', 'NCR', 'Manila', 14.5995, 120.9842),
(2, 'SM Megamall', 'Ortigas', 'NCR', 'Mandaluyong', 14.5873, 121.0615),
(3, 'Ayala Makati', 'Makati', 'NCR', 'Makati', 14.5547, 121.0244),
(4, 'Robinsons Galleria', 'Quezon City', 'NCR', 'Quezon City', 14.6285, 121.0559),
(5, 'SM City Cebu', 'Cebu City', 'Region VII', 'Cebu City', 10.3157, 123.8854),
(6, 'Ayala Center Cebu', 'Cebu City', 'Region VII', 'Cebu City', 10.3181, 123.8998),
(7, 'SM Lanang Davao', 'Davao City', 'Region XI', 'Davao City', 7.1074, 125.6220),
(8, 'Abreeza Mall', 'Davao City', 'Region XI', 'Davao City', 7.0731, 125.6128);