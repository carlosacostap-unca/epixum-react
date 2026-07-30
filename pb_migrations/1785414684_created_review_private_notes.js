/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_4163081445",
        "help": "",
        "hidden": false,
        "id": "relation2034467270",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "review",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text4274335913",
        "max": 20000,
        "min": 0,
        "name": "content",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_172606212",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_review_private_notes_review` ON `review_private_notes` (`review`)"
    ],
    "listRule": "@request.auth.role = \"admin\"",
    "name": "review_private_notes",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.role = \"admin\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_172606212");

  return app.delete(collection);
})
