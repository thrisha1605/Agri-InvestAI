package com.agriinvest.scheduler;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.agriinvest.model.SIP;
import com.agriinvest.repository.SIPRepository;
import com.agriinvest.service.InvestmentService;
import com.agriinvest.service.SIPService;

@Component
public class SIPScheduler {

    @Autowired
    private SIPRepository sipRepository;

    @Autowired
    private InvestmentService investmentService;

    @Autowired
    private SIPService sipService;

    // Runs every month (demo: every 1 minute)
    @Scheduled(cron = "0 */1 * * * ?")
    public void processSIP() {

        List<SIP> activeSIPs = sipRepository.findByStatus("ACTIVE");

        for (SIP sip : activeSIPs) {
            if (!sip.isAutoDebitEnabled() && "DISABLED".equalsIgnoreCase(sip.getAutoDebitStatus())) {
                continue;
            }

            if (sip.getNextDebitDate() > System.currentTimeMillis()) {
                continue;
            }

            investmentService.invest(
                    sip.getUserId(),
                    sip.getProjectId(),
                    sip.getAmount(),
                    "SIP"
            );

            sipService.markProcessed(sip);

            System.out.println("SIP processed for: " + sip.getUserId());
        }
    }
}
