class ProductionsService {
  constructor() {
    this.productions = [];
  }

  async getAllProductions({ page = 1, limit = 10 }) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProductions = this.productions.slice(startIndex, endIndex);

    return {
      data: paginatedProductions,
      pagination: {
        total: this.productions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(this.productions.length / limit)
      }
    };
  }

  async getProductionById(id) {
    return this.productions.find(prod => prod.id === id);
  }

  async createProduction(data) {
    const newProduction = {
      id: Date.now().toString(), // Simple ID generation
      ...data,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.productions.push(newProduction);
    return newProduction;
  }

  async updateProduction(id, updateData) {
    const index = this.productions.findIndex(prod => prod.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedProduction = {
      ...this.productions[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.productions[index] = updatedProduction;
    return updatedProduction;
  }

  async deleteProduction(id) {
    const index = this.productions.findIndex(prod => prod.id === id);
    
    if (index === -1) {
      return false;
    }

    this.productions.splice(index, 1);
    return true;
  }
}

module.exports = new ProductionsService(); 