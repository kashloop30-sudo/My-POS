// This configuration maps standard schema terms to industry-specific terms based on Business Type

export const BUSINESS_TYPES = {
  HOSPITAL: {
    terms: {
      client: 'Patient',
      clients: 'Patients',
      service: 'Treatment',
      services: 'Treatments',
      task: 'Procedure/Task',
      tasks: 'Procedures/Tasks',
      branch: 'Ward/Clinic',
      branches: 'Wards/Clinics',
      staff: 'Medical Staff',
    },
    features: ['appointments', 'medical_records', 'prescriptions'],
  },
  RETAIL: {
    terms: {
      client: 'Customer',
      clients: 'Customers',
      service: 'Product',
      services: 'Products',
      task: 'Restock/Task',
      tasks: 'Restocks/Tasks',
      branch: 'Store',
      branches: 'Stores',
      staff: 'Store Clerk',
    },
    features: ['inventory', 'pos', 'barcode_scanning'],
  },
  BAR: {
    terms: {
      client: 'Patron',
      clients: 'Patrons',
      service: 'Drink/Menu Item',
      services: 'Drinks/Menu',
      task: 'Prep Task',
      tasks: 'Prep Tasks',
      branch: 'Location',
      branches: 'Locations',
      staff: 'Bartender/Server',
    },
    features: ['tabs', 'inventory', 'happy_hour'],
  },
  DEFAULT: {
    terms: {
      client: 'Client',
      clients: 'Clients',
      service: 'Service',
      services: 'Services',
      task: 'Task',
      tasks: 'Tasks',
      branch: 'Branch',
      branches: 'Branches',
      staff: 'Staff',
    },
    features: [],
  }
};

export const getBusinessConfig = (type) => {
  if (!type) return BUSINESS_TYPES.DEFAULT;
  const normalizedType = type.toUpperCase();
  return BUSINESS_TYPES[normalizedType] || BUSINESS_TYPES.DEFAULT;
};

export const getTerm = (type, termKey) => {
  const config = getBusinessConfig(type);
  return config.terms[termKey] || BUSINESS_TYPES.DEFAULT.terms[termKey];
};
