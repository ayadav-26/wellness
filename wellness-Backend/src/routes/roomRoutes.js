const express = require('express');
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/',   [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], roomController.createRoom);
router.get('/',    [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], roomController.listRooms);
router.get('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin', 'Receptionist'])], roomController.getRoom);
router.put('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], roomController.updateRoom);
router.delete('/:id', [authMiddleware, roleMiddleware(['Super_Admin', 'Admin'])], roomController.deleteRoom);

module.exports = router;
