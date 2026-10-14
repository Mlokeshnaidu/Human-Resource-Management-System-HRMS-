-- =====================================================================
-- Human Resource Management System (HRMS) Database Schema
-- Database: MySQL (Engine: InnoDB)
-- Database Name: hrms_db
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `hrms_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hrms_db`;

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checkIn` datetime DEFAULT NULL,
  `checkOut` datetime DEFAULT NULL,
  `workingHours` float NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isOverride` tinyint(1) NOT NULL,
  `overrideReason` text COLLATE utf8mb4_unicode_ci,
  `overriddenBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance_emp_date` (`employeeId`,`date`),
  KEY `ix_attendance_date` (`date`),
  KEY `ix_attendance_employeeId` (`employeeId`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('00970705-b70f-49c9-a7b8-b332a1a63dde', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('019013da-51a1-4073-8077-6304a6744006', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('075fa227-fdff-4681-bddf-5d50ea8f20d6', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('0f96dcf5-8db6-4864-8c64-ad0494e1cf1d', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('1234277a-679b-4995-8021-f1cdaec7b465', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('1a0fd89a-6bcf-48ff-98b8-a543df94b239', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('1b03f3fd-edc2-45f8-90d9-2d0574d8b287', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('1f1f10fb-87d5-4503-b3e2-d3897b6b8957', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('21e79fa9-8e07-490f-a9a5-4fd9a7c3e167', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('22c8701c-8480-47a6-8217-a7cebb000bd7', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('231c94fd-e41f-4ca5-a236-427d0fb78fcb', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('23445ac5-4baa-4ad5-ad3c-06e049da0f6c', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('23bee32c-6b79-4117-bbc0-40d8bbebb5c0', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('28caae91-eb8e-447e-83fc-e20184ad19ba', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('2afa36b0-9b00-42a9-9f59-aab8adf57269', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('2e312633-2e6d-40d2-82ae-0750a1dbd45d', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('30644848-079d-49a5-b475-c0bd39e35f32', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('307819db-ce61-4e64-bc8b-f298a1f00a25', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('369053e4-528d-4fb8-8b58-b940010f57d7', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3a87175c-5dbb-4f0a-8e39-3c8e3aefd744', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3b6182bd-caae-4dd4-9bbc-3659026c5ce0', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3bd05f9c-f6c1-445c-9ee6-ff0d58edf85b', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3ce786c2-02fc-4376-86cb-75214368e607', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3cef631d-24f8-4e83-84ea-789b4f4e768a', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3d1395b2-69e2-4a4c-afd0-40dea2585320', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('3f095e72-6cd1-4266-80ad-bf6af8cedad7', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('419525a2-b930-4beb-9629-918f14080b40', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('46bd470a-5c2d-46fe-9a32-38c6986cdc4a', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('49ecdad2-f67c-48d2-9ab8-93e3e64e6b77', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('4c1d4b89-6363-4034-a0ee-d1c2b1a7cdeb', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('50fc1781-9af0-4f36-907b-d20d622c1e96', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('61663ea1-1d3a-489d-b23b-736a0c69ee87', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('69049425-bf3d-4890-a656-47b274375f2f', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('6f4b66d0-4ef3-4fb7-a216-d7d894973c6a', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('718add8d-222c-4b7d-9fdc-cb1ab3579981', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('7f4b15c1-6a57-4123-b4e5-29350700e8c9', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('7fafbc35-4f9a-458d-9a33-b90e985d1af9', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('82dcd82c-7cf8-47a9-b5ec-05e9e443eb3b', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('853912f8-641e-43c3-80aa-ca3fd7b14ee7', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('8730cff3-1c58-4212-abdb-038907c7e9b6', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('8a20a939-4dd9-4d82-bb94-886dccfd078f', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('8f2cf1a5-6165-4ee9-9d49-0372ecee7914', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('935c6806-ab65-431b-8101-f06cbae863c9', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('96380638-220a-4968-a2e3-036d9c269908', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('99b3b105-2077-40dd-9f99-eefcc36e22ea', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('9a83047f-c266-4911-8be9-0e30915b7591', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('9c7195a5-5715-43fb-8c02-94ffe27249e9', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('9f3069d3-303d-42e7-862c-273ff4fa588f', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('a0eee5ae-03d5-49de-9b78-ff077b04b71d', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('a3ca5e64-96a7-466e-8e08-89da7ad796d7', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('a5feddd5-d0b3-4832-b587-8cac8ff92b58', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('b46890bc-dcca-4d43-8696-9fa2eefd6426', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-13', '2026-10-13 09:00:00', '2026-10-13 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('b8c69d9c-20e3-40d4-bd71-ff9ca984cdcc', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('be515776-0203-47ef-b553-fb96efce9d2a', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('c542fa04-a671-41f4-90c9-e69bb92a8899', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('c71788ac-d5be-40d9-b8d3-8eb7b0438c99', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('ccefad3f-9a4c-4321-9e84-7f81326417e9', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('ce60c68e-09b8-4e6d-9a11-bf7ec8064082', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('d1bf58df-1de5-4223-9678-4370bba64c14', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('d4b60e6b-54ae-486b-a28e-729c6365238c', 'b4eeaf57-fe17-4416-8280-4fd964020de1', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('d9382aeb-d153-4baf-a40d-0a6bfdf460df', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('da24a023-bb4e-4d58-a462-53a8423319d8', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('dde4f2ce-803b-4fa7-b5d8-1474e81b8e4c', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('dfbd5f4a-7da1-4a4d-b372-d3d69c6fc0cb', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-05', '2026-10-05 09:00:00', '2026-10-05 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('e1bc179a-5f54-4a59-b6ba-c46bb9f15ee9', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('e32a9e7e-d29d-4f8d-9ec6-d60ef792fbb8', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('e6570605-e367-4b2b-8528-aa9d4e5342ba', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('e87dd751-908d-40cd-90c4-ea7dc1c10efc', '1b9629d6-b70e-48e1-b60e-199c141ca22f', '2026-10-09', '2026-10-09 09:00:00', '2026-10-09 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('ee10b508-ac96-499a-8313-6ae6abf5c5de', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('f44f311d-77f1-452b-a832-b39e1195713d', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-07', '2026-10-07 09:00:00', '2026-10-07 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('f526fcb2-70ba-4301-917d-5f2e09573436', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('f5c026c5-e5ef-4d07-9375-fb287a7cdab5', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', '2026-10-10', '2026-10-10 09:00:00', '2026-10-10 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('f66b5129-1fb5-436e-8440-13cbf6b3af4b', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('f818d21f-ef0f-411a-a463-64a811bdeb8e', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('f8f39327-f241-461f-8adf-72e6289292e2', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('fc3160bf-748d-4618-b40c-bb7f6e86eb3e', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', '2026-10-12', '2026-10-12 09:00:00', '2026-10-12 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('fd1629d4-9182-442a-873c-af6f0b637d1d', '03c65f2d-aa80-4319-b44e-0661e3479c68', '2026-10-08', '2026-10-08 09:00:00', '2026-10-08 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('fd9fd427-d4a9-40b5-baf8-579fe15465c0', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-04', '2026-10-04 09:00:00', '2026-10-04 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('ff862a75-3472-4116-869e-4e9d0bbaab33', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', '2026-10-06', '2026-10-06 09:00:00', '2026-10-06 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `attendance` (`id`, `employeeId`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`, `isOverride`, `overrideReason`, `overriddenBy`, `notes`, `createdAt`, `updatedAt`) VALUES ('ffb9d39b-daac-469b-a468-2c6af44e7ae5', '04ee3934-57cf-4ee0-a945-8dbe09414c52', '2026-10-11', '2026-10-11 09:00:00', '2026-10-11 18:00:00', 9.0, 'PRESENT', 0, NULL, NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userRole` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetEntity` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ipAddress` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_audit_logs_targetEntity` (`targetEntity`),
  KEY `ix_audit_logs_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`id`, `userId`, `userEmail`, `userRole`, `action`, `targetEntity`, `targetId`, `details`, `ipAddress`, `createdAt`) VALUES ('8349b140-65ff-459d-ab24-ffc4a42821f2', NULL, 'admin@hrms.com', 'ADMIN', 'SYSTEM_INITIALIZED', 'System', NULL, 'MySQL database initialized and seeded with enterprise dataset', '127.0.0.1', '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documentType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `originalName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` int NOT NULL,
  `mimeType` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploadedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_documents_employeeId` (`employeeId`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `email_logs` (`id`, `to`, `subject`, `template`, `payload`, `status`, `sentAt`) VALUES ('228c18a9-6636-42bb-a6ec-c5e4e683d919', 'employee@hrms.com', 'Welcome to HRMS Portal, Kiran V!', 'ONBOARDING', '{"employeeCode": "HRMS-1002"}', 'SENT', '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `designation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `joiningDate` datetime NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `baseSalary` float NOT NULL,
  `hra` float NOT NULL,
  `allowances` float NOT NULL,
  `pfDeduction` float NOT NULL,
  `taxDeduction` float NOT NULL,
  `bankName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyContact` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `ix_employees_employeeCode` (`employeeCode`),
  KEY `ix_employees_department` (`department`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('03c65f2d-aa80-4319-b44e-0661e3479c68', 'HRMS-1005', '0c0b1acd-42b6-4f13-acec-0b46243d12ea', 'Guna Sekhar', 'V', '+91 98765-43213', 'Finance & Accounting', 'Senior Financial Analyst', '2024-03-15 00:00:00', 'ACTIVE', 72000.0, 21600.0, 6000.0, 5184.0, 4800.0, 'Axis Bank', '778899001122', 'UTIB0001005', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('0472cd4d-aad6-4b05-ad9d-ed9112af1aac', 'HRMS-1006', '5c733e18-0629-4b9b-9e59-81749ae5f5d6', 'Keerthi', 'M', '+91 98765-43214', 'Sales & Marketing', 'Growth Marketing Lead', '2024-07-01 00:00:00', 'ACTIVE', 68000.0, 20400.0, 5500.0, 4896.0, 4400.0, 'Kotak Mahindra Bank', '889900112233', 'KKBK0001006', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('04ee3934-57cf-4ee0-a945-8dbe09414c52', 'HRMS-1003', 'e0167f89-8ad9-4442-b4ff-739cb854d9f8', 'Naveen', 'G', '+91 98765-43211', 'Engineering', 'Senior Frontend Architect', '2023-11-01 00:00:00', 'ACTIVE', 90000.0, 27000.0, 8000.0, 6480.0, 6800.0, 'HDFC Bank', '556677889900', 'HDFC0001003', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('1b9629d6-b70e-48e1-b60e-199c141ca22f', 'HRMS-1004', 'e4d1e47f-2546-4b39-9df9-1c767dcd671e', 'Ramya', 'P', '+91 98765-43212', 'Product & Design', 'Staff Product Designer', '2024-01-10 00:00:00', 'ACTIVE', 78000.0, 23400.0, 7000.0, 5616.0, 5200.0, 'ICICI Bank', '667788990011', 'ICIC0001004', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('34f78f14-413a-46ea-b5c8-5d4fc735a86d', 'HRMS-1002', 'bb9597a5-5775-4201-9350-ce1225b9d2c4', 'Kiran', 'V', '+91 98765-43210', 'Engineering', 'Lead Software Engineer', '2023-08-10 00:00:00', 'ACTIVE', 95000.0, 28500.0, 9500.0, 6840.0, 7200.0, 'State Bank of India', '445566778899', 'SBIN0001002', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('b4eeaf57-fe17-4416-8280-4fd964020de1', 'HRMS-1001', '79ee123b-1935-44b7-b556-4e0b0cb6ef3f', 'Giri', 'Prasad', '+1 555-0101', 'Human Resources', 'Senior HR Operations Lead', '2023-04-01 00:00:00', 'ACTIVE', 85000.0, 25500.0, 8000.0, 6120.0, 5500.0, 'HDFC Bank', '112233445566', 'HDFC0004921', '+1 555-0111', '120 Market St, San Francisco, CA', '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('cdb89423-28c4-42ef-b32f-430f8f2fc37a', 'HRMS-1000', '19eb3d74-90da-4dc7-b90e-07abc52e22ac', 'Mandala', 'Lokesh', '+1 555-0100', 'Executive Management', 'Chief Technology Officer / Administrator', '2023-01-15 00:00:00', 'ACTIVE', 150000.0, 45000.0, 15000.0, 10800.0, 12500.0, 'Silicon Valley Bank', '987654321011', 'SVBK0001928', '+1 555-0999', '450 University Ave, Palo Alto, CA', '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `employees` (`id`, `employeeCode`, `userId`, `firstName`, `lastName`, `phone`, `department`, `designation`, `joiningDate`, `status`, `baseSalary`, `hra`, `allowances`, `pfDeduction`, `taxDeduction`, `bankName`, `accountNumber`, `ifscCode`, `emergencyContact`, `address`, `createdAt`, `updatedAt`) VALUES ('ee6466a7-9e56-4a8c-874b-20997ecc8c4d', 'HRMS-1007', 'c67b57ae-887c-4645-85a2-b2a9d660e692', 'Eeswar', 'M', '+91 98765-43215', 'Engineering', 'DevOps & Cloud Engineer', '2024-08-15 00:00:00', 'ACTIVE', 70000.0, 21000.0, 6000.0, 5040.0, 4500.0, 'State Bank of India', '990011223344', 'SBIN0001007', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `leave_balances`;
CREATE TABLE `leave_balances` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int NOT NULL,
  `leaveType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalDays` float NOT NULL,
  `usedDays` float NOT NULL,
  `remainingDays` float NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leave_balance_emp_yr_type` (`employeeId`,`year`,`leaveType`),
  KEY `ix_leave_balances_employeeId` (`employeeId`),
  KEY `ix_leave_balances_year` (`year`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('043372d2-12e7-44bc-98da-70297aa4ea40', '03c65f2d-aa80-4319-b44e-0661e3479c68', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('29169f58-9524-4d64-b1b5-2fc991bb7a8e', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('2c45709b-2d26-427b-bed6-5b1ed6fefc00', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('2d0e3293-871f-4255-9ae4-5fc52bfd51c5', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('334573f8-d466-40d5-ac67-612ace130020', '04ee3934-57cf-4ee0-a945-8dbe09414c52', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('34ccaf31-961b-4385-9654-6e4c0daec4f9', 'b4eeaf57-fe17-4416-8280-4fd964020de1', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('431cdf8e-ebee-4bfb-8574-dd760b1c0b9b', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('4980cc9d-e65c-4b57-b475-e1649af21d77', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('4e3560cd-7e13-466b-9d7d-e31d785f33c5', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('5d297552-58ff-44ae-8997-d93c29a197ff', '03c65f2d-aa80-4319-b44e-0661e3479c68', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('62d3f2a6-1027-4a3e-90ab-86b58189dc64', '1b9629d6-b70e-48e1-b60e-199c141ca22f', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('642469cc-5faf-4e12-9b8f-b626174dad93', '1b9629d6-b70e-48e1-b60e-199c141ca22f', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('7081b01b-e829-4cc4-9bf5-2c5722210db7', '04ee3934-57cf-4ee0-a945-8dbe09414c52', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('717e17ff-ec1f-4eef-a364-1496f9d8b7f0', '04ee3934-57cf-4ee0-a945-8dbe09414c52', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('73adf400-7167-4be1-a3cd-c6303cddada8', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('75ff3c82-fe54-4dad-8d76-a4dc749f3e45', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('8ec69639-a76d-4bf7-8ef0-0ae7a3e419be', '03c65f2d-aa80-4319-b44e-0661e3479c68', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('9cfe9591-4e8c-41b9-a1df-5a74d0ec6e2a', 'b4eeaf57-fe17-4416-8280-4fd964020de1', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('ba8092d3-5367-4f67-a4c4-1fe024d9330f', 'b4eeaf57-fe17-4416-8280-4fd964020de1', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('bf4182db-b3fe-486d-8a42-a542f8929ddb', '1b9629d6-b70e-48e1-b60e-199c141ca22f', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('c33eb7a6-5b97-48ff-aa40-58bc1d542a0e', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('d26508d6-283f-47e5-8a1d-375aa853d7df', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', 2026, 'PL', 15.0, 3.0, 12.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('edb5cc0f-b535-46e3-bb4c-4ca12ea75bfd', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 2026, 'SL', 10.0, 1.0, 9.0, '2026-10-14 06:50:35');
INSERT INTO `leave_balances` (`id`, `employeeId`, `year`, `leaveType`, `totalDays`, `usedDays`, `remainingDays`, `updatedAt`) VALUES ('ff475dcf-3f43-4954-943a-4184420ddbc8', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', 2026, 'CL', 12.0, 2.0, 10.0, '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leaveType` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endDate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `totalDays` float NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `rejectionReason` text COLLATE utf8mb4_unicode_ci,
  `isLossOfPay` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_leave_requests_employeeId` (`employeeId`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leave_requests` (`id`, `employeeId`, `leaveType`, `startDate`, `endDate`, `totalDays`, `reason`, `status`, `reviewedBy`, `reviewedAt`, `rejectionReason`, `isLossOfPay`, `createdAt`, `updatedAt`) VALUES ('290746d6-fdf9-419d-bf5e-f41fb2901441', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 'CL', '2026-09-15', '2026-09-16', 2.0, 'Family medical consultation', 'APPROVED', 'hr@hrms.com', '2026-09-14 10:30:00', NULL, 0, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `leave_requests` (`id`, `employeeId`, `leaveType`, `startDate`, `endDate`, `totalDays`, `reason`, `status`, `reviewedBy`, `reviewedAt`, `rejectionReason`, `isLossOfPay`, `createdAt`, `updatedAt`) VALUES ('dbc8e148-0174-4bdf-8fa4-94b3390c590f', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 'SL', '2026-10-20', '2026-10-21', 2.0, 'Dental appointment & recovery', 'PENDING', NULL, NULL, NULL, 0, '2026-10-14 06:50:35', '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_notifications_userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payrolls`;
CREATE TABLE `payrolls` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `employeeId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `totalWorkingDays` int NOT NULL,
  `presentDays` float NOT NULL,
  `paidLeaveDays` float NOT NULL,
  `lopDays` float NOT NULL,
  `baseSalary` float NOT NULL,
  `hra` float NOT NULL,
  `allowances` float NOT NULL,
  `bonus` float NOT NULL,
  `grossSalary` float NOT NULL,
  `pf` float NOT NULL,
  `tax` float NOT NULL,
  `lopDeduction` float NOT NULL,
  `otherDeductions` float NOT NULL,
  `totalDeductions` float NOT NULL,
  `netSalary` float NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isLocked` tinyint(1) NOT NULL,
  `lockedAt` datetime DEFAULT NULL,
  `paymentDate` datetime DEFAULT NULL,
  `paymentMethod` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactionReference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_emp_mo_yr` (`employeeId`,`month`,`year`),
  KEY `ix_payrolls_month` (`month`),
  KEY `ix_payrolls_employeeId` (`employeeId`),
  KEY `ix_payrolls_year` (`year`),
  CONSTRAINT `payrolls_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('087c9e3e-4df0-43c1-bca4-8cdd4e9fa017', '1b9629d6-b70e-48e1-b60e-199c141ca22f', 10, 2026, 31, 31.0, 0.0, 0.0, 78000.0, 23400.0, 7000.0, 0.0, 108400.0, 5616.0, 5200.0, 0.0, 0.0, 10816.0, 97584.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('139f890f-0d54-4116-93db-c7523e38da4a', '03c65f2d-aa80-4319-b44e-0661e3479c68', 10, 2026, 31, 31.0, 0.0, 0.0, 72000.0, 21600.0, 6000.0, 0.0, 99600.0, 5184.0, 4800.0, 0.0, 0.0, 9984.0, 89616.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('20ee57e0-7c3b-49f3-a30e-1d4516f179a1', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', 9, 2026, 30, 28.0, 2.0, 0.0, 150000.0, 45000.0, 15000.0, 2000.0, 212000.0, 10800.0, 12500.0, 0.0, 0.0, 23300.0, 188700.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10009281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('4c622bc3-33a5-4ab1-8e83-d64283f3056d', '04ee3934-57cf-4ee0-a945-8dbe09414c52', 9, 2026, 30, 28.0, 2.0, 0.0, 90000.0, 27000.0, 8000.0, 2000.0, 127000.0, 6480.0, 6800.0, 0.0, 0.0, 13280.0, 113720.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10039281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('672a95d0-bc2e-4c1f-9bb7-4adaac4c69cf', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 9, 2026, 30, 28.0, 2.0, 0.0, 95000.0, 28500.0, 9500.0, 2000.0, 135000.0, 6840.0, 7200.0, 0.0, 0.0, 14040.0, 120960.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10029281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('6f47e170-f8d6-460c-8976-a6d4d03c54ca', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', 9, 2026, 30, 28.0, 2.0, 0.0, 68000.0, 20400.0, 5500.0, 2000.0, 95900.0, 4896.0, 4400.0, 0.0, 0.0, 9296.0, 86604.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10069281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('701092db-36d3-4029-ab56-dc8480196874', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', 9, 2026, 30, 28.0, 2.0, 0.0, 70000.0, 21000.0, 6000.0, 2000.0, 99000.0, 5040.0, 4500.0, 0.0, 0.0, 9540.0, 89460.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10079281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('78aadcd6-fe54-44fc-8eb7-105857dd04a3', '04ee3934-57cf-4ee0-a945-8dbe09414c52', 10, 2026, 31, 31.0, 0.0, 0.0, 90000.0, 27000.0, 8000.0, 0.0, 125000.0, 6480.0, 6800.0, 0.0, 0.0, 13280.0, 111720.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('818ca315-034a-4b60-948f-7e82fcf0b618', 'cdb89423-28c4-42ef-b32f-430f8f2fc37a', 10, 2026, 31, 31.0, 0.0, 0.0, 150000.0, 45000.0, 15000.0, 0.0, 210000.0, 10800.0, 12500.0, 0.0, 0.0, 23300.0, 186700.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('8a1f41a1-6061-4dee-ba6c-d47d7cab4283', 'b4eeaf57-fe17-4416-8280-4fd964020de1', 10, 2026, 31, 31.0, 0.0, 0.0, 85000.0, 25500.0, 8000.0, 0.0, 118500.0, 6120.0, 5500.0, 0.0, 0.0, 11620.0, 106880.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('96ec29c0-30a0-4599-8b74-64038fb6e7f8', '03c65f2d-aa80-4319-b44e-0661e3479c68', 9, 2026, 30, 28.0, 2.0, 0.0, 72000.0, 21600.0, 6000.0, 2000.0, 101600.0, 5184.0, 4800.0, 0.0, 0.0, 9984.0, 91616.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10059281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('c3b0db01-ce18-4d99-af14-490bfefcc773', '1b9629d6-b70e-48e1-b60e-199c141ca22f', 9, 2026, 30, 28.0, 2.0, 0.0, 78000.0, 23400.0, 7000.0, 2000.0, 110400.0, 5616.0, 5200.0, 0.0, 0.0, 10816.0, 99584.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10049281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('d636222f-3021-48e8-ae36-e1c6d004a422', 'b4eeaf57-fe17-4416-8280-4fd964020de1', 9, 2026, 30, 28.0, 2.0, 0.0, 85000.0, 25500.0, 8000.0, 2000.0, 120500.0, 6120.0, 5500.0, 0.0, 0.0, 11620.0, 108880.0, 'PAID', 1, '2026-10-01 09:00:00', '2026-10-01 14:30:00', 'NEFT / DIRECT_BANK_TRANSFER', 'SIM-NEFT-10019281', NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('e3c86a5e-230b-4062-bedc-3080637a06e8', '0472cd4d-aad6-4b05-ad9d-ed9112af1aac', 10, 2026, 31, 31.0, 0.0, 0.0, 68000.0, 20400.0, 5500.0, 0.0, 93900.0, 4896.0, 4400.0, 0.0, 0.0, 9296.0, 84604.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('f34b2be9-daef-404c-ba27-e54413e95ef9', '34f78f14-413a-46ea-b5c8-5d4fc735a86d', 10, 2026, 31, 31.0, 0.0, 0.0, 95000.0, 28500.0, 9500.0, 0.0, 133000.0, 6840.0, 7200.0, 0.0, 0.0, 14040.0, 118960.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `payrolls` (`id`, `employeeId`, `month`, `year`, `totalWorkingDays`, `presentDays`, `paidLeaveDays`, `lopDays`, `baseSalary`, `hra`, `allowances`, `bonus`, `grossSalary`, `pf`, `tax`, `lopDeduction`, `otherDeductions`, `totalDeductions`, `netSalary`, `status`, `isLocked`, `lockedAt`, `paymentDate`, `paymentMethod`, `transactionReference`, `remarks`, `createdAt`, `updatedAt`) VALUES ('fc4e3932-59b2-4df2-83f2-be0705695909', 'ee6466a7-9e56-4a8c-874b-20997ecc8c4d', 10, 2026, 31, 31.0, 0.0, 0.0, 70000.0, 21000.0, 6000.0, 0.0, 97000.0, 5040.0, 4500.0, 0.0, 0.0, 9540.0, 87460.0, 'PROCESSED', 0, NULL, NULL, 'BANK_TRANSFER', NULL, NULL, '2026-10-14 06:50:35', '2026-10-14 06:50:35');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('0c0b1acd-42b6-4f13-acec-0b46243d12ea', 'guna.sekhar@hrms.com', '$2b$10$BJUjSE6wZe3DVP425tYAa.lzP30v0s5g8yHgCjz/ULulu4OI7PK8C', 'EMPLOYEE', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('19eb3d74-90da-4dc7-b90e-07abc52e22ac', 'admin@hrms.com', '$2b$10$h425Pc9Xuqb.qtX.vH9myOb/ORzupEK0MBGQvqFKI7hyTv1l6r3LS', 'ADMIN', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('5c733e18-0629-4b9b-9e59-81749ae5f5d6', 'keerthi.m@hrms.com', '$2b$10$BJUjSE6wZe3DVP425tYAa.lzP30v0s5g8yHgCjz/ULulu4OI7PK8C', 'EMPLOYEE', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('79ee123b-1935-44b7-b556-4e0b0cb6ef3f', 'hr@hrms.com', '$2b$10$lkOueD2FZaZYIuWz6I5yvesR2SIuh8KG9hg2ADAf6btqOHR4Tniuq', 'HR', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('bb9597a5-5775-4201-9350-ce1225b9d2c4', 'employee@hrms.com', '$2b$10$RYgUc7fDBC5GVqeh0DiOE.Ce4dAPqEBADR1uLRmZqCRX/.KR8.W.u', 'EMPLOYEE', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('c67b57ae-887c-4645-85a2-b2a9d660e692', 'eeswar.m@hrms.com', '$2b$10$BJUjSE6wZe3DVP425tYAa.lzP30v0s5g8yHgCjz/ULulu4OI7PK8C', 'EMPLOYEE', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('e0167f89-8ad9-4442-b4ff-739cb854d9f8', 'naveen.g@hrms.com', '$2b$10$BJUjSE6wZe3DVP425tYAa.lzP30v0s5g8yHgCjz/ULulu4OI7PK8C', 'EMPLOYEE', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
INSERT INTO `users` (`id`, `email`, `password`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES ('e4d1e47f-2546-4b39-9df9-1c767dcd671e', 'ramya.p@hrms.com', '$2b$10$BJUjSE6wZe3DVP425tYAa.lzP30v0s5g8yHgCjz/ULulu4OI7PK8C', 'EMPLOYEE', 1, '2026-10-14 06:50:35', '2026-10-14 06:50:35');
