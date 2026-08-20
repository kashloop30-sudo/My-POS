const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get all businesses for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    let businesses;
    if (req.user.role === 'SUPER_ADMIN') {
      businesses = await prisma.business.findMany();
    } else {
      businesses = await prisma.business.findMany({
        where: { ownerId: req.user.id },
      });
    }
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single business
router.get('/:id', protect, async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
    });
    
    if (!business) return res.status(404).json({ message: 'Business not found' });
    
    // Check ownership if not super admin
    if (req.user.role !== 'SUPER_ADMIN' && business.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new business
router.post('/', protect, async (req, res) => {
  try {
    const { name, logo, type, currency } = req.body;
    
    const business = await prisma.business.create({
      data: {
        name,
        logo,
        type,
        currency,
        ownerId: req.user.id,
      },
    });
    
    // Update user role to BUSINESS_ADMIN if they were just a STAFF/default user
    if (req.user.role === 'STAFF') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { role: 'BUSINESS_ADMIN' }
      });
    }
    
    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a business
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, logo, type, currency } = req.body;
    
    const existing = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Business not found' });
    
    if (req.user.role !== 'SUPER_ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: { name, logo, type, currency },
    });
    
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a business
router.delete('/:id', protect, async (req, res) => {
  try {
    const existing = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Business not found' });
    
    if (req.user.role !== 'SUPER_ADMIN' && existing.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.business.delete({
      where: { id: req.params.id },
    });
    
    res.json({ message: 'Business removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
