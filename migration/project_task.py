import pymongo
import json

db_name ="ipexco"

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

dblist = myclient.list_database_names()
if db_name in dblist:
  print("The database exists.")

mydb = myclient[db_name]

projectCollection = mydb['projects']


for project in projectCollection.find():
    print(project['name'])

    task = project['baseTask']
    print('---')
    print(type(task))
    print('---')

    # If task is a string, parse it first
    if isinstance(task, str):
        task = json.loads(task)

    # Now task is a dictionary, check if model is a string that needs parsing
    if isinstance(task['model'], str):
        model = json.loads(task['model'])
        task['model'] = model

    myquery = { "_id": project['_id'] }
    newvalues = { "$set": { "baseTask": task } }

    projectCollection.update_one(myquery, newvalues)
