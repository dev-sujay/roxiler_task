// controllers/transactionController.js
const Transaction = require('../models/transactionModel');
const axios = require('axios');

const initializeDB = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json'); // Replace with actual URL
        const transactions = response.data;

        await Transaction.deleteMany({});
        await Transaction.insertMany(transactions);

        res.status(200).send('Database initialized with seed data');
    } catch (error) {
        res.status(500).send('Error initializing database');
    }
};

const getTransactions = async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 10, search = '', month } = req.query;
        if(!month) {
            return res.status(400).json({
                message: 'Month is required'
            });
        }
        const skip = (parseInt(pageNumber) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);
        let query = {
            "$expr": {
                "$eq": [
                    { "$month": "$dateOfSale" },
                    parseInt(month)
                ]
            }
        };

        if (search) {
            query = {
                "$or": [
                    { "title": { "$regex": search, "$options": "i" } },
                    { "description": { "$regex": search, "$options": "i" } },
                ]
            };
        }

        const numericSearch = parseFloat(search);
        if (!isNaN(numericSearch)) {
            query.$or.push({
                "price": {
                    "$gte": numericSearch - 10,
                    "$lte": numericSearch + 10
                }
            });
        }

        const count = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query).skip(skip).limit(limit);

        res.status(200).json({ rows: transactions, count });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching transactions',
            error: error.message,
        });
    }
};

const getStatistics = async (req, res) => {
    try {
        const { month } = req.query;

        const totalSaleAmount = await Transaction.aggregate([
            {
                "$match": {
                    "$expr": {
                        "$eq": [
                            { "$month": "$dateOfSale" },
                            parseInt(month)
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "totalPrice": { "$sum": "$price" },
                    "count": { "$sum": 1 }
                }
            }
        ]);

        const totalNotSoldItems = await Transaction.aggregate([
            {
                "$match": {
                    "$expr": {
                        "$ne": [
                            { "$month": "$dateOfSale" },
                            parseInt(month)
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "count": { "$sum": 1 }
                }
            }
        ]);

        res.status(200).json({
            totalSaleAmount: totalSaleAmount[0]?.totalPrice || 0,
            totalSoldItems: totalSaleAmount[0]?.count || 0,
            totalNotSoldItems: totalNotSoldItems[0]?.count || 0
        });
    } catch (error) {
        res.status(500).send('Error fetching statistics');
    }
};

const getBarChart = async (req, res) => {
    try {
        const { month } = req.query;

        const barChartData = await Transaction.aggregate([
            {
                '$match': {
                    '$expr': {
                        '$eq': [
                            { '$month': '$dateOfSale' },
                            parseInt(month)
                        ]
                    }
                }
            },
            {
                '$bucket': {
                    'groupBy': '$price',
                    'boundaries': [0, 101, 201, 301, 401, 501, 601, 701, 801, 901],
                    'default': '901-above',
                    'output': { 'count': { '$sum': 1 } }
                }
            }
        ]);

        const priceRanges = [
            { range: '0-100', _id: 0 },
            { range: '101-200', _id: 101 },
            { range: '201-300', _id: 201 },
            { range: '301-400', _id: 301 },
            { range: '401-500', _id: 401 },
            { range: '501-600', _id: 501 },
            { range: '601-700', _id: 601 },
            { range: '701-800', _id: 701 },
            { range: '801-900', _id: 801 },
            { range: '901-above', _id: "901-above" },
        ];

        const result = priceRanges.map(({ range, _id }) => {
            const data = barChartData.find((item) => item._id === _id);
            return { range, count: data?.count || 0 };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).send('Error fetching bar chart data');
    }
};

const getPieChart = async (req, res) => {
    try {
        const { month } = req.query;

        const pieChartData = await Transaction.aggregate([
            {
                "$match": {
                    "$expr": {
                        "$eq": [
                            { "$month": "$dateOfSale" },
                            parseInt(month)
                        ]
                    }
                }
            },
            {
                '$group': {
                    '_id': '$category',
                    'count': { '$sum': 1 }
                }
            }
        ]);

        res.status(200).json(pieChartData);
    } catch (error) {
        res.status(500).send('Error fetching pie chart data');
    }
};

const getCombinedData = async (req, res) => {
    try {
        const { month } = req.query;

        // Get the protocol
        const protocol = req.protocol;
        // Get the hostname
        const hostname = req.hostname;
        // Combine them to get the full URL
        const fullUrl = `${protocol}://${hostname}`;

        const [statistics, barChart, pieChart] = await Promise.all([
            axios.get(`${fullUrl}:${process.env.PORT || 8000}/api/v1/statistics`, { params: { month } }),
            axios.get(`${fullUrl}:${process.env.PORT || 8000}/api/v1/bar-chart`, { params: { month } }),
            axios.get(`${fullUrl}:${process.env.PORT || 8000}/api/v1/pie-chart`, { params: { month } }),
        ]);

        res.status(200).json({
            statistics: statistics.data,
            barChart: barChart.data,
            pieChart: pieChart.data,
        });
    } catch (error) {
        res.status(500).send('Error fetching combined data');
    }
};

module.exports = {
    initializeDB,
    getTransactions,
    getStatistics,
    getBarChart,
    getPieChart,
    getCombinedData
};
