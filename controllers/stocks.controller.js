const stocksService = require('../services/stocks.service');

exports.getAllStocks = async (req, res) => {
  try {
    const data = await stocksService.getAllStocks();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createStock = async (req, res) => {
  try {
    const stock = await stocksService.createStock(req.body);
    res.status(201).json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const stock = await stocksService.updateStock(req.params.id, req.body);
    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    await stocksService.deleteStock(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};