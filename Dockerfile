FROM ruby:3.2.2-slim-buster

RUN apt-get update && \
    apt-get install -y build-essential

WORKDIR /root/app
COPY ./ ./
RUN bundle
RUN rake assets:precompile

CMD rackup -o 0.0.0.0 -p 9696
