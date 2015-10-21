@echo off

echo Creando directorios de la base de datos...
if not exist ".\db" mkdir .\db
if not exist ".\db\data" mkdir .\db\data

echo Iniciando MongoDB...
"%ProgramFiles%\MongoDB\Server\3.0\bin\mongod.exe" --logpath .\db\logs.txt --dbpath .\db\data
