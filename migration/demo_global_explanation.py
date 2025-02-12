import pymongo
import json

db_name ="ipexco"

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

dblist = myclient.list_database_names()
if db_name in dblist:
  print("The database exists.")

mydb = myclient[db_name]

projectCollection = mydb['projects']


for demo in projectCollection.find():
    # if(str(demo['_id']) == '675ae52bca97da29b8329496'):
      print(demo['_id'])
      print(demo['name'])

      if 'globalExplanation' not in demo:
        print('no explanation to convert')
        continue

      try:
        globalExp = demo['globalExplanation']
        MUGS = json.loads(globalExp['MUGS'])
        MGCS = json.loads(globalExp['MGCS'])

        globalExp['MUGS'] = MUGS
        globalExp['MGCS'] = MGCS

        myquery = { "_id": demo['_id'] }
        newvalues = { "$set": {'globalExplanation': globalExp} }

        projectCollection.update_one(myquery, newvalues)
      except:
         print("Already converted")
    