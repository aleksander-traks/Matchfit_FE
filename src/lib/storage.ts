const PROFILE_ID_KEY = 'matchfit_profile_id';

export const storage = {
  setProfileId(profileId: string) {
    localStorage.setItem(PROFILE_ID_KEY, profileId);
  },

  getProfileId(): string | null {
    return localStorage.getItem(PROFILE_ID_KEY);
  },

  clearProfileId() {
    localStorage.removeItem(PROFILE_ID_KEY);
  },
};
