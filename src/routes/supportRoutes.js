const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { supportTicketSchema, supportReplySchema } = require('../validators/paymentValidators');

router.use(authenticate);
router.post('/', validate(supportTicketSchema), supportController.createTicket);
router.get('/', supportController.getMyTickets);
router.get('/:id', supportController.getTicketDetails);
router.post('/:id/reply', validate(supportReplySchema), supportController.replyToTicket);

module.exports = router;
