import { axiosClient } from '@/services';

export const campaignApi = {
  getConstants(options = {}) {
    return axiosClient.get('/campaigns/constants', options);
  },

  getCustomers({ page = 1, limit = 10, search = '' } = {}, options = {}) {
    return axiosClient.get('/campaigns/customers', {
      params: {
        page,
        limit,
        search: search ? search.trim() : undefined,
      },
      ...options,
    });
  },

  getTemplates({ page = 1, limit = 3 } = {}, options = {}) {
    return axiosClient.get('/campaigns/templates', {
      params: { page, limit },
      ...options,
    });
  },

  getTemplateById(id, options = {}) {
    return axiosClient.get(`/campaigns/templates/${id}`, options);
  },

  createTemplate(payload, options = {}) {
    return axiosClient.post('/campaigns/templates', payload, options);
  },

  updateTemplate(id, payload, options = {}) {
    return axiosClient.patch(`/campaigns/templates/${id}`, payload, options);
  },

  deleteTemplate(id, options = {}) {
    return axiosClient.delete(`/campaigns/templates/${id}`, options);
  },

  previewTemplate(id, payload, options = {}) {
    return axiosClient.post(`/campaigns/templates/${id}/preview`, payload, options);
  },

  sendCampaign(payload, options = {}) {
    return axiosClient.post('/campaigns/send', payload, options);
  },
};
