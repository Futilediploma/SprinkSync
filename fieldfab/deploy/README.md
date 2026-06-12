# FieldFab Server Deploy

This folder gives the server a repeatable FieldFab deploy path.

## One-Time Setup

Run these on the server after pulling the repo:

```bash
cd ~/SprinkSync/fieldfab/backend
python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r requirements.txt

sudo cp ~/SprinkSync/fieldfab/deploy/fieldfab.service.example /etc/systemd/system/fieldfab.service
sudo systemctl daemon-reload
sudo systemctl enable --now fieldfab
```

Check logs:

```bash
sudo journalctl -u fieldfab -n 50 --no-pager
```

## Deploy Updates

Deploy the currently checked-out branch:

```bash
bash ~/SprinkSync/fieldfab/deploy/deploy-fieldfab.sh
```

Deploy a specific branch:

```bash
DEPLOY_BRANCH=feature/manpower-updates bash ~/SprinkSync/fieldfab/deploy/deploy-fieldfab.sh
```

The script will:

- pull the latest code
- create `fieldfab/backend/venv` if missing
- install backend requirements inside the venv
- install frontend packages
- build `fieldfab/dist`
- restart the `fieldfab` systemd service if installed
- fall back to `nohup uvicorn` if the service is not installed
- reload nginx when possible

If nginx asks for a password during reload, run this manually:

```bash
sudo systemctl reload nginx
```
