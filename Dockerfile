FROM ruby:3.2.2-slim-buster

RUN apt-get update && \
    apt-get install -y build-essential

WORKDIR /root/app
COPY ./ ./
RUN bundle
RUN SESSION_SECRET="12da0bd7d11d024c385f579ea91a0949793dcc85b33e2278535a39247c9b3018" rake assets:precompile

CMD rackup -o 0.0.0.0 -p 9696
