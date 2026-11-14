import { describeMessageTransport } from './MessageTransport.contract';
import { FakeMessageTransport } from './FakeMessageTransport';

describeMessageTransport('FakeMessageTransport', () => {
  const transport = new FakeMessageTransport();
  return {
    transport,
    open: () => undefined,
    deliver: (message) => {
      transport.receive(message);
    },
    drop: () => {
      transport.drop();
    },
    received: () => transport.sent,
  };
});
