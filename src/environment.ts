
export class Environment {

    public experimentsRootPath = process.env.EXPERIMENTROOTPATH ? process.env.EXPERIMENTROOTPATH : '';
    public planner = process.env.PLANNER ? process.env.PLANNER : '';
    public propertyChecker = process.env.PROPERTYCHECKER ? process.env.PROPERTYCHECKER : '';
    public pddlParser = process.env.PDDLPARSER ? process.env.PDDLPARSER : '';
    public demoGenerator = process.env.DEMOGENERATOR ? process.env.DEMOGENERATOR : '';
    public maxUtility = process.env.MAXUTILITY ? process.env.MAXUTILITY : '';

    public uploadsPath =  process.env.UPLOADPATH ? process.env.UPLOADPATH : '';
    public resultsPath = process.env.RESULTPATH ? process.env.RESULTPATH : '';
    public serverResultsPath = process.env.SERVERRESULTPATH ? process.env.SERVERRESULTPATH : '';

    public ltltkit = process.env.LTLFKIT ? process.env.LTLFKIT : '';
    public spot = process.env.SPOT  ? process.env.SPOT : '';
    public val = process.env.VAL  ? process.env.VAL : '';

    public path = process.env.PATH  ? process.env.PATH : '';

    public port = process.env.PORT  ? process.env.PORT : '';
    public jwtKey = process.env.JWT_KEY ? process.env.JWT_KEY : '';

    constructor() { }

}


