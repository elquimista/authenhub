FROM ruby:3.2.2-slim-buster

RUN apt-get update && \
    apt-get install -y build-essential

WORKDIR /root/app
COPY ./ ./
RUN bundle
RUN SESSION_SECRET="2c854d74df3ce0c0ef4e" rake assets:precompile

CMD rackup -o 0.0.0.0 -p 9696
