FROM python:3.11.5-alpine3.18

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

#Create an empty config file so that we can just use the defaults.  This file can be mounted if it needs to be
#modified
RUN touch /config.toml

#Apparently using -u causes the logs to output immediately
CMD [ "python", "-u", "./watcher.py", "/config.toml" ]
