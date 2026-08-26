import express from "express";
import {
  getSightingQuestions,
  postPublicSighting,
} from "@/controllers/public-sighting";

const router = express.Router();

/**
 * @swagger
 * /questions/{type}:
 *   get:
 *     summary: Get all questions by type
 *     description: Retrieve all questions for a specific context type (reporting or sighting). Returns cached data if available, otherwise fetches from database and caches for 7 days.
 *     tags: [Question]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [reporting, sighting, REPORTING, SIGHTING]
 *         description: The type of questions to retrieve (case-insensitive)
 *         example: reporting
 *     responses:
 *       200:
 *         description: Questions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reporting questions fetched successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           topic:
 *                             type: string
 *                             description: Question topic/category
 *                             example: location
 *                           label:
 *                             type: object
 *                             properties:
 *                               en:
 *                                 type: string
 *                                 description: Question label in English
 *                                 example: What is the location?
 *                               bn:
 *                                 type: string
 *                                 description: Question label in Bengali
 *                                 example: অবস্থান কি?
 *                           type:
 *                             type: string
 *                             description: Question type (e.g., text, select, multi-select)
 *                             example: text
 *                           isOptional:
 *                             type: boolean
 *                             description: Whether the question is optional
 *                             example: false
 *                           optionKey:
 *                             type: string
 *                             description: Key for question options (if applicable)
 *                             example: threats
 *                           options:
 *                             type: array
 *                             description: Available options for the question (if applicable)
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                   example: 1
 *                                 label:
 *                                   type: object
 *                                   properties:
 *                                     en:
 *                                       type: string
 *                                       example: Fishing nets
 *                                     bn:
 *                                       type: string
 *                                       example: মাছ ধরার জাল
 *                     speciesAgeGroups:
 *                       type: array
 *                       description: Available age groups for species
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           label:
 *                             type: object
 *                             properties:
 *                               en:
 *                                 type: string
 *                                 example: Adult
 *                               bn:
 *                                 type: string
 *                                 example: প্রাপ্তবয়স্ক
 *       400:
 *         description: Invalid question type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid question type
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", getSightingQuestions);

/**
 * @swagger
 * /form:
 *   post:
 *     summary: Submit a public sighting
 *     description: Create a sighting from the public form without authentication. The record is attributed to the anonymous user. Coordinates and state are resolved from village/ghat, block, and district via geocoding.
 *     tags: [Public Sighting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - observedAt
 *               - species
 *               - waterBodyCondition
 *               - weatherCondition
 *               - hasWindyOrStormyWeather
 *               - channelType
 *               - waterBody
 *               - threats
 *               - district
 *               - block
 *               - villageOrGhat
 *             properties:
 *               observedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time when the sighting occurred (ISO 8601 format)
 *                 example: 2025-12-15T10:30:00Z
 *               species:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of species observed (minimum 1 required)
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Species type identifier
 *                       example: GANGES_DOLPHIN
 *                     ageGroup:
 *                       type: object
 *                       description: Age group counts for the observed species
 *                       properties:
 *                         adult:
 *                           type: integer
 *                           minimum: 0
 *                           example: 2
 *                         subAdult:
 *                           type: integer
 *                           minimum: 0
 *                           example: 1
 *                         adultMale:
 *                           type: integer
 *                           minimum: 0
 *                           example: 1
 *                         adultFemale:
 *                           type: integer
 *                           minimum: 0
 *                           example: 1
 *                         unidentified:
 *                           type: integer
 *                           minimum: 0
 *                           example: 0
 *               waterBodyCondition:
 *                 type: string
 *                 description: Condition of the water body
 *                 example: CALM
 *               weatherCondition:
 *                 type: string
 *                 description: Weather condition during observation
 *                 example: SUNNY
 *               hasWindyOrStormyWeather:
 *                 type: string
 *                 description: Indicates if weather was windy or stormy (YES/NO)
 *                 example: NO
 *               channelType:
 *                 type: string
 *                 description: Type of water body channel
 *                 example: MAIN_CHANNEL
 *               waterBody:
 *                 type: string
 *                 description: Type of water body
 *                 example: RIVER
 *               threats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of threat identifiers observed
 *                 example: ["FISHING_NET", "POLLUTION"]
 *               district:
 *                 type: string
 *                 description: District where the sighting occurred
 *                 example: Kolkata
 *               block:
 *                 type: string
 *                 description: Block where the sighting occurred
 *                 example: Block A
 *               villageOrGhat:
 *                 type: string
 *                 description: Village or ghat name (used with district and block for geocoding)
 *                 example: Prinsep Ghat
 *               landmark:
 *                 type: string
 *                 description: Nearby landmark (optional)
 *                 example: Near the ferry terminal
 *               fishingGears:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of fishing gear identifiers observed (optional)
 *                 example: ["GILL_NET", "TRAWL_NET"]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs or object paths (optional)
 *                 example: ["parent/folder/image_12345.jpg"]
 *               notes:
 *                 type: string
 *                 description: Additional notes or observations (optional)
 *                 example: Dolphins were swimming near the shore
 *     responses:
 *       201:
 *         description: Sighting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sighting created successfully
 *       400:
 *         description: Validation error, anonymous user missing, or location could not be geocoded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Validation error
 *                 message:
 *                   type: string
 *                   example: Species must contain at least 1 record
 *       500:
 *         description: Failed to create sighting
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to create sighting
 */
router.post("/", postPublicSighting);

export default router;
