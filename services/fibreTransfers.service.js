const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class FibreTransfersService {
  constructor() {
    this.transfers = [];
  }

  async getAllFibreTransfers({ status, page = 1, limit = 10 }) {
    let filteredTransfers = this.transfers;
    
    if (status) {
      filteredTransfers = this.transfers.filter(transfer => transfer.status === status.toUpperCase());
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

    return {
      data: paginatedTransfers,
      pagination: {
        total: filteredTransfers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredTransfers.length / limit)
      }
    };
  }

  async getFibreTransferById(id) {
    return this.transfers.find(transfer => transfer.id === id);
  }

  async createFibreTransfer(data) {
    const newTransfer = {
      id: Date.now().toString(), // Simple ID generation
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.transfers.push(newTransfer);
    return newTransfer;
  }

  async updateFibreTransfer(id, updateData) {
    const index = this.transfers.findIndex(transfer => transfer.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedTransfer = {
      ...this.transfers[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.transfers[index] = updatedTransfer;
    return updatedTransfer;
  }

  async deleteFibreTransfer(id) {
    const index = this.transfers.findIndex(transfer => transfer.id === id);
    
    if (index === -1) {
      return false;
    }

    this.transfers.splice(index, 1);
    return true;
  }

  async getPendingTransfers() {
    return this.transfers.filter(transfer => transfer.status === 'PENDING');
  }
}

module.exports = new FibreTransfersService(); 