const express = require('express');
const { verifyTokenAndTenant } = require('../middlewares/auth.middleware');


const {
  createMailingList,
  getMailingLists,
  deleteMailingList,
  updateMailingList, // ✅ add this
} = require('../controllers/mailingLists.controller');

const router = express.Router();
router.use(verifyTokenAndTenant);
router.post('/', createMailingList);
router.get('/', getMailingLists);
router.put('/:id', updateMailingList); // ✅ define update route
router.delete('/:id', deleteMailingList);

module.exports = router;