// /mod-3-atencion-cliente/api/ratings.js

window.RatingsApi = {
  getBaseUrl: () => {
    const config = window.__APP_CONFIG__;
    const baseUrl = config?.ATC_URL;
    return `${baseUrl.replace(/\/$/, '')}/api/v1/atencion-cliente`;
  },

  async sendRating(clientId, payload) {
    const url = `${window.RatingsApi.getBaseUrl()}/ratings/clients/${clientId}`;
    const response = await window.HttpClient.request(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (response.error) throw new Error(response.error);
    return response;
  },

  async getSummaryByWaiter(waiterId, from, to) {
    const params = new URLSearchParams();
    if (waiterId) params.set('waiter_id', waiterId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const url = `${window.RatingsApi.getBaseUrl()}/ratings/summary?${params.toString()}`;
    const response = await window.HttpClient.request(url, { method: 'GET' });
    if (response.error) throw new Error(response.error);
    return response;
  }
  ,
  async getClientWaiters(clientId) {
    const url = `${window.RatingsApi.getBaseUrl()}/ratings/clients/${clientId}/waiters`;
    const response = await window.HttpClient.request(url, { method: 'GET' });
    if (response.error) throw new Error(response.error);
    return response;
  }
};