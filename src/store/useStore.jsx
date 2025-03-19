
import {create} from 'zustand'

const useStore = create((set) => ({
  workTimeRecords: [], // Initialize as an empty array
  setWorkTimeRecords: (records) => set({ workTimeRecords: records }),
}));

export default useStore;
