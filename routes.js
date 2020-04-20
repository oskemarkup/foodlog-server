const router = require('express').Router();
const { readMeals, createMeal, updateMeal, deleteMeal } = require('./controller');
const { checkToken, checkId, writeLog } = require('./utils');

const logger = {
  create: writeLog('create', (req) => ({ data: req.body })),
  update: writeLog('update', (req) => ({ id: req.query.id, data: req.body })),
  delete: writeLog('delete', (req) => ({ id: req.query.id })),
};

router.use(checkToken);
router.get('/read', readMeals);
router.post('/create', createMeal, logger.create);
router.post('/update', checkId, updateMeal, logger.update);
router.post('/delete', checkId, deleteMeal, logger.delete);
router.use((req, res) => {
  const { result } = res.locals;

  if (result) {
    res.send(result);
  }
});

module.exports = router;
