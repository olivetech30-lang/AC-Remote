// src/main.cpp
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>  // ← Required
#include <MQTT.h>
#include "ACREMOTE.h"

// ====== Config ======
const char* WIFI_SSID = "FFC-MISC";
const char* WIFI_PASS = "";

#define MQTT_HOST "80d05987fa4647e5977ef063b3937df0.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "vercel"
#define MQTT_PASS "Olive123"

#define CMD_TOPIC "ac/esp32/cmd"
#define STATUS_TOPIC "ac/esp32/status"

#define IR_RX 14
#define IR_TX 4

// ====== Global Objects ======
ACRemote ac(IR_RX, IR_TX);
WiFiClientSecure wifiClient;  // ← Declare BEFORE mqtt
MQTTClient mqtt;

// ====== Message Handler ======
void onMessage(String &topic, String &payload) {
    Serial.println("📥 CMD: " + payload);
    if (payload == "POWER_ON" || payload == "POWER_OFF") {
        ac.send(payload.c_str());
    } else if (payload.startsWith("TEMP_")) {
        ac.send(payload.c_str());
    }
    mqtt.publish(STATUS_TOPIC, "{\"status\":\"executed\",\"cmd\":\"" + payload + "\"}");
}

// ====== Setup ======
void setup() {
    Serial.begin(115200);
    ac.begin();

    // Connect to Wi-Fi
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.println("Connecting to WiFi...");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\n✅ WiFi Connected!");

    // Configure secure client
    wifiClient.setInsecure(); // Skip cert validation

    // Initialize MQTT with secure client
    mqtt.begin(MQTT_HOST, MQTT_PORT, wifiClient); // ← Pass client object
    mqtt.onMessage(onMessage);
}

// ====== Loop ======
void loop() {
    if (!mqtt.connected()) {
        Serial.println("📡 Connecting to MQTT...");
        if (mqtt.connect("esp32_ac", MQTT_USER, MQTT_PASS)) {
            Serial.println("✅ MQTT Connected!");
            mqtt.subscribe(CMD_TOPIC);
            mqtt.publish(STATUS_TOPIC, "{\"status\":\"online\"}");
        } else {
            Serial.println("❌ MQTT Failed. Retrying...");
            delay(5000);
            return;
        }
    }
    mqtt.loop();
    ac.handleLearning();
}