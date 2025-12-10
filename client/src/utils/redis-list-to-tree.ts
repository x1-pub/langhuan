import { ERedisDataType, TRedisKeyViewType } from '@packages/types/redis';
import { RouterOutput } from './trpc';

type TRedisKeys = RouterOutput['redis']['getKeys']['items'];

interface IRedisKeysTableData {
  name: string;
  key: string;
  children: IRedisKeysTableData[];
  type?: ERedisDataType;
  ttl?: number;
  size?: number;
  isLeaf?: boolean;
}

const redisListToTree = (
  items: TRedisKeys,
  tableType: TRedisKeyViewType,
): IRedisKeysTableData[] => {
  if (tableType === 'list') {
    return items.map(item => ({ ...item, name: item.key, children: [], isLeaf: true }));
  }

  const root: IRedisKeysTableData = {
    name: '',
    key: '',
    children: [],
  };

  for (const item of items) {
    const parts = item.key.split(':');
    let currentNode = root;

    const currentPath: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath.push(part);
      const currentKey = currentPath.join(':');

      let child = currentNode.children.find(n => n.name === part);
      if (!child) {
        child = {
          name: part,
          key: currentKey,
          children: [],
        };
        currentNode.children.push(child);
      }

      currentNode = child;

      if (i === parts.length - 1) {
        currentNode.type = item.type;
        currentNode.ttl = item.ttl;
        currentNode.size = item.size;
        currentNode.isLeaf = true;
      }
    }
  }

  return root.children;
};

export default redisListToTree;
