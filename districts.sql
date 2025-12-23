-- Districts Table for Hong Kong 18 Districts
-- Run this after schema.sql to create districts reference table

CREATE TABLE
IF NOT EXISTS `districts`
(
  `id` INT NOT NULL AUTO_INCREMENT,
  `districtEN` VARCHAR
(100) NOT NULL,
  `districtTC` VARCHAR
(100) NOT NULL,
  `districtSC` VARCHAR
(100) NOT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY
(`id`),
  UNIQUE KEY `idx_district_en`
(`districtEN`),
  KEY `idx_district_tc`
(`districtTC`),
  KEY `idx_district_sc`
(`districtSC`),
  KEY `idx_display_order`
(`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Hong Kong 18 Districts data
INSERT INTO `districts` (`
id`,
`districtEN
`, `districtTC`, `districtSC`, `displayOrder`) VALUES
(1, 'Central & Western', '中西區', '中西区', 1),
(2, 'Eastern', '東區', '东区', 2),
(3, 'Islands', '離島區', '离岛区', 3),
(4, 'Kowloon City', '九龍城區', '九龙城区', 4),
(5, 'Kwai Tsing', '葵青區', '葵青区', 5),
(6, 'Kwun Tong', '觀塘區', '观塘区', 6),
(7, 'North', '北區', '北区', 7),
(8, 'Sai Kung', '西貢區', '西贡区', 8),
(9, 'Sha Tin', '沙田區', '沙田区', 9),
(10, 'Sham Shui Po', '深水埗區', '深水埗区', 10),
(11, 'Southern', '南區', '南区', 11),
(12, 'Tai Po', '大埔區', '大埔区', 12),
(13, 'Tsuen Wan', '荃灣區', '荃湾区', 13),
(14, 'Tuen Mun', '屯門區', '屯门区', 14),
(15, 'Wan Chai', '灣仔區', '湾仔区', 15),
(16, 'Wong Tai Sin', '黃大仙區', '黄大仙区', 16),
(17, 'Yau Tsim Mong', '油尖旺區', '油尖旺区', 17),
(18, 'Yuen Long', '元朗區', '元朗区', 18);
