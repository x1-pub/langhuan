import useMain from '@/utils/use-main';

const Viewer = () => {
  const { connectionId, connectionType, wind, active } = useMain();
  return (
    <div>
      <div>connectionId: {connectionId}</div>
      <div>connectionType: {connectionType}</div>
      <div>active: {active}</div>
      <div>wind: {JSON.stringify(wind)}</div>
    </div>
  );
};

export default Viewer;
