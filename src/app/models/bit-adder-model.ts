import { LogicLabModel } from './types';

export const bitAdderModel: LogicLabModel = {
  components: {
    BATTERY: {
      type: "SOURCE"
    },
    SWITCH000: {
      type: "SWITCH",
      closed: true
    },
    // ... rest of the components from net-1bitadder.js
  },
  wires: [
    {
      pin0: "BATTERY",
      pin1: "SWITCH000",
      hidden: true
    },
    // ... rest of the wires from net-1bitadder.js
  ]
};