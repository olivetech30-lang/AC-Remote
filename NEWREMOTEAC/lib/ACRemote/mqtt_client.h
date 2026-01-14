// src/mqtt_client.h
#pragma once
#include <Arduino.h>
#include "ACREMOTE.h"

class MQTTClient {
public:
    MQTTClient(ACRemote& ac);
    void begin();
    void loop();

private:
    ACRemote& _ac;
    void callback(char* topic, uint8_t* payload, unsigned int length);
};