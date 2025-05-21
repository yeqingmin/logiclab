import { LogicLabModel } from './types';

export const emptyModel: LogicLabModel = {
  components: {
    BATTERY: {
      type: "SOURCE"
    },
    SWITCH000: {
      type: "SWITCH",
      closed: true
    },
    // ... rest of the components from net-empty.js
  },
  wires: [
    {
      pin0: "BATTERY",
      pin1: "SWITCH000",
      hidden: true
    },
    // ... rest of the wires from net-empty.js
  ]
};