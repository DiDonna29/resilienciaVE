import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SeismicEventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join group
        await self.channel_layer.group_add('seismic_events', self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard('seismic_events', self.channel_name)

    async def receive(self, text_data):
        # Clients are mostly read-only, but let's handle simple ping requests
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    async def seismo_message(self, event):
        # Send message to WebSocket client
        await self.send(text_data=json.dumps(event['data']))
