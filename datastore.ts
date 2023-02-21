import { Datastore, Entity } from "@google-cloud/datastore";

const _Datastore = Datastore;
export { _Datastore as Datastore };
export const db = new Datastore();
export function fromDatastore(item: Entity) {
  item.id = item[Datastore.KEY].id;
  return item;
}
