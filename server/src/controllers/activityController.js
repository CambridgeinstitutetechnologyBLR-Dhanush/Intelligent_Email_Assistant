const activityService = require('../services/activityService');

const getActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await activityService.getByUser(req.userId, { page: parseInt(page), limit: parseInt(limit) });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const activity = await activityService.getById(req.params.id, req.userId);
    if (!activity) return res.status(404).json({ error: 'Not found' });
    res.json(activity);
  } catch (error) {
    next(error);
  }
};

module.exports = { getActivities, getActivity };
