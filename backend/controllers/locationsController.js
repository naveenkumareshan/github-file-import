
const { Country, State, City, Area } = require('../models/Location');

// Countries
exports.getCountries = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    
    const countries = await Country.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Country.countDocuments(query);
    
    res.json({
      success: true,
      data: countries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCountry = async (req, res) => {
  try {
    const { name, code } = req.body;
    const country = await Country.create({ name, code });
    res.status(201).json({ success: true, data: country });
  } catch (error) {
    console.error('Create country error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findByIdAndUpdate(id, req.body, { new: true });
    if (!country) {
      return res.status(404).json({ success: false, message: 'Country not found' });
    }
    res.json({ success: true, data: country });
  } catch (error) {
    console.error('Update country error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    await Country.findByIdAndDelete(id);
    res.json({ success: true, message: 'Country deleted successfully' });
  } catch (error) {
    console.error('Delete country error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// States
exports.getStates = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', countryId = '' } = req.query;
    let query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (countryId) {
      query.countryId = countryId;
    }
    
    const states = await State.find(query)
      .populate('countryId', 'name code')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await State.countDocuments(query);
    
    res.json({
      success: true,
      data: states,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createState = async (req, res) => {
  try {
    const { name, code, countryId } = req.body;
    const state = await State.create({ name, code, countryId });
    await state.populate('countryId', 'name code');
    res.status(201).json({ success: true, data: state });
  } catch (error) {
    console.error('Create state error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const state = await State.findByIdAndUpdate(id, req.body, { new: true })
      .populate('countryId', 'name code');
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    res.json({ success: true, data: state });
  } catch (error) {
    console.error('Update state error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    await State.findByIdAndDelete(id);
    res.json({ success: true, message: 'State deleted successfully' });
  } catch (error) {
    console.error('Delete state error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Cities
exports.getCities = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', stateId = '' } = req.query;
    let query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (stateId) {
      query.stateId = stateId;
    }
    
    const cities = await City.find(query)
      .populate({
        path: 'stateId',
        select: 'name code',
        populate: {
          path: 'countryId',
          select: 'name code'
        }
      })
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await City.countDocuments(query);
    
    res.json({
      success: true,
      data: cities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCity = async (req, res) => {
  try {
    const { name, stateId, latitude, longitude } = req.body;
    const city = await City.create({ name, stateId, latitude, longitude });
    await city.populate({
      path: 'stateId',
      select: 'name code',
      populate: {
        path: 'countryId',
        select: 'name code'
      }
    });
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findByIdAndUpdate(id, req.body, { new: true })
      .populate({
        path: 'stateId',
        select: 'name code',
        populate: {
          path: 'countryId',
          select: 'name code'
        }
      });
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    res.json({ success: true, data: city });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    await City.findByIdAndDelete(id);
    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Areas
exports.getAreas = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', cityId = '' } = req.query;
    let query = {};
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (cityId) {
      query.cityId = cityId;
    }
    
    const areas = await Area.find(query)
      .populate({
        path: 'cityId',
        select: 'name',
        populate: {
          path: 'stateId',
          select: 'name code',
          populate: {
            path: 'countryId',
            select: 'name code'
          }
        }
      })
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Area.countDocuments(query);
    
    res.json({
      success: true,
      data: areas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createArea = async (req, res) => {
  try {
    const { name, cityId, pincode, latitude, longitude } = req.body;
    const area = await Area.create({ name, cityId, pincode, latitude, longitude });
    await area.populate({
      path: 'cityId',
      select: 'name',
      populate: {
        path: 'stateId',
        select: 'name code',
        populate: {
          path: 'countryId',
          select: 'name code'
        }
      }
    });
    res.status(201).json({ success: true, data: area });
  } catch (error) {
    console.error('Create area error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByIdAndUpdate(id, req.body, { new: true })
      .populate({
        path: 'cityId',
        select: 'name',
        populate: {
          path: 'stateId',
          select: 'name code',
          populate: {
            path: 'countryId',
            select: 'name code'
          }
        }
      });
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }
    res.json({ success: true, data: area });
  } catch (error) {
    console.error('Update area error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    await Area.findByIdAndDelete(id);
    res.json({ success: true, message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Delete area error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
