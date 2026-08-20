const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get clients (filter by businessId or branchId)
router.get('/', protect, async (req, res) => {
  try {
    const { businessId, branchId } = req.query;
    
    let whereClause = {};

    if (branchId) {
      whereClause.branchId = branchId;
    } else if (businessId) {
      // Find all branches for this business
      const branches = await prisma.branch.findMany({ where: { businessId } });
      const branchIds = branches.map(b => b.id);
      whereClause.branchId = { in: branchIds };
    } else {
      return res.status(400).json({ message: 'Must provide businessId or branchId' });
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new client or log a visit
router.post('/', protect, async (req, res) => {
  try {
    const { name, contact, service, amountPaid, branchId } = req.body;
    
    // Check if client exists by contact in this branch
    let client = await prisma.client.findFirst({
      where: { contact, branchId }
    });

    const visitRecord = {
      date: new Date().toISOString(),
      service: service || 'General',
      amount: parseFloat(amountPaid) || 0,
      staffId: req.user.id,
      staffName: req.user.name
    };

    if (client) {
      // Update existing client
      let history = [];
      if (client.history) {
        try {
          history = JSON.parse(client.history);
        } catch(e) {}
      }
      history.push(visitRecord);

      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          history: JSON.stringify(history),
          totalSpend: client.totalSpend + (parseFloat(amountPaid) || 0)
        }
      });
    } else {
      // Create new client
      client = await prisma.client.create({
        data: {
          name,
          contact,
          branchId,
          history: JSON.stringify([visitRecord]),
          totalSpend: parseFloat(amountPaid) || 0
        }
      });
    }

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
