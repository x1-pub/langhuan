import useDatabaseWindows from '@/hooks/use-database-windows';

const Viewer = () => {
  const { connectionId, connectionType, wind, active } = useDatabaseWindows();
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
