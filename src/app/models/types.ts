export interface Component {
  type: string;
  closed?: boolean;
  op?: string;
  i0?: string;
  i1?: string;
  o0?: string;
}

export interface Wire {
  pin0: string;
  pin1: string;
  hidden?: boolean;
}

export interface LogicLabModel {
  components: { [key: string]: Component };
  wires: Wire[];
}

export interface Events {
  listeners: { [key: string]: Function[] };
  listen: (key: string, listener: Function) => void;
  dispatch: (eventType: string, event: any) => void;
  onframe?: Function;
  onmousemove?: Function;
  onmousedown?: Function;
  onmouseup?: Function;
  remove?: (event: string, listener: Function) => void;
}