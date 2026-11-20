import React from 'react';

export type QrMenuMotion = {
  settled: boolean;
  requestMeasure: () => void;
};

const noop = () => {};

export const QrMenuMotionCtx = React.createContext<QrMenuMotion>({
  settled: true,
  requestMeasure: noop,
});
