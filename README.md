# tcp-transboost README

Extension for executing ordered test cases that are being automatically discovered from your project using the unittest library and run trough a Transboost Model(XGBoost) predicting a failure probability. Failed tests will be displayed with an ❌

## Features

Mostly my extension is created with python scripts
    -discovering unittests
    -extracting test case features from your project's logs
    -model predicts failure probabilities
    -execute unittests ordered by failure rate

For example if there is an image subfolder under your extension project workspace:


![Logo](images/logo.png)
\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements
!PYTHON PROJECT!

Every folder which may lead to a unittest discovery must contain a __init__.py file. This is a requirement of the unittest library.

Every Test class must end with Test: Pattern: *Test

PROJECT-SIMULATION/
│
├── main.py
├── org/
│   ├── __init__.py           👈 ADD THIS
│   └── apache/
│       ├── __init__.py       👈 ADD THIS
│       └── sling/
│           ├── __init__.py   👈 ADD THIS
│           └── provisioning/
│               ├── __init__.py 👈 ADD THIS
│               └── model/
│                   ├── __init__.py ✅ already here
│                   ├── FeatureTest.py
│                   └── ModelProcessorTest.py


Test logs must be stored from exact path: -root/data/MLDataSet.csv
PROJECT-SIMULATION/
│
├── data/
│   ├── MLDataSet.csv


Your python project must use a virtual environment explicitly named 'venv'. Also your project must be on windows. The extension is not compatible with other OS.

**Enjoy!**
