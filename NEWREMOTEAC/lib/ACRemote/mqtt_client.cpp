// src/mqtt_client.cpp
#include "mqtt_client.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// === CONFIGURATION (replace with your HiveMQ details) ===
#define MQTT_HOST "80d05987fa4647e5977ef063b3937df0.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "vercel"
#define MQTT_PASS "Olive123"
#define CMD_TOPIC "ac/esp32/cmd"
#define STATUS_TOPIC "ac/esp32/status"

static WiFiClientSecure wifiClient;
static PubSubClient *mqttClient = nullptr;
static ACRemote* acInstance = nullptr;

void mqttCallback(char* topic, uint8_t* payload, unsigned int length) {
    payload[length] = '\0';
    String cmd = String((char*)payload);
    
    if (acInstance) {
        if (cmd == "POWER") {
            acInstance->send("POWER");
        } else if (cmd.startsWith("TEMP_")) {
            acInstance->send(cmd.c_str());
        }
        // Publish confirmation
        String reply = "Executed: " + cmd;
        mqttClient->publish(STATUS_TOPIC, reply.c_str());
    }
}

MQTTClient::MQTTClient(ACRemote& ac) : _ac(ac) {
    acInstance = &ac;
    wifiClient.setInsecure(); // Required for HiveMQ Cloud TLS
    mqttClient = new PubSubClient(MQTT_HOST, MQTT_PORT, mqttCallback, wifiClient);
}

void MQTTClient::begin() {
    while (!mqttClient->connected()) {
        Serial.println("Connecting to MQTT...");
        if (mqttClient->connect("esp32_ac_remote", MQTT_USER, MQTT_PASS)) {
            Serial.println("MQTT connected!");
            mqttClient->subscribe(CMD_TOPIC);
            mqttClient->publish(STATUS_TOPIC, "ESP32 AC Remote Online");
        } else {
            Serial.println("MQTT failed, retrying in 5s...");
            delay(5000);
        }
    }
}

void MQTTClient::loop() {
    if (!mqttClient->connected()) {
        begin(); // Reconnect if needed
    }
    mqttClient->loop();
}