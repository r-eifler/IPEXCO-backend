import pymongo
from dateutil.parser import parse

db_name ="ipexco"

myclient = pymongo.MongoClient("mongodb://localhost:27017/")

dblist = myclient.list_database_names()
if db_name in dblist:
  print("The database exists.")

mydb = myclient[db_name]

collection = mydb['user-studies']

collection.update_many(
    { "startDate": { "$type": "string" } },
    [{ 
      "$set": { 
        "startDate": { "$toDate": "$startDate" }
      }
    }]
)

collection.update_many(
    { "endDate": { "$type": "string" } },
    [{ 
      "$set": { 
        "endDate": { "$toDate": "$endDate" }
      }
    }]
)

